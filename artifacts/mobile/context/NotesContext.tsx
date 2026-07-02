import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Alert, Platform, Share } from "react-native";

export interface Entry {
  id: string;
  type: "note" | "diary";
  title: string;
  content: string;
  tags: string[];
  photos: string[];
  createdAt: string;
  date: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
}

interface NotesContextType {
  entries: Entry[];
  isLoading: boolean;
  allTags: string[];
  noteTags: string[];
  diaryTags: string[];
  addEntry: (entry: Omit<Entry, "id" | "createdAt">) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<Entry, "id" | "createdAt">>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  exportJSON: () => Promise<void>;
  exportHTML: () => Promise<void>;
  importJSON: (mode: "replace" | "merge") => Promise<ImportResult | null>;
}

const STORAGE_KEY = "notlar_entries_v1";

const NotesContext = createContext<NotesContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setEntries(JSON.parse(raw) as Entry[]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (updated: Entry[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEntries(updated);
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<Entry, "id" | "createdAt">) => {
      const newEntry: Entry = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
      await persist([newEntry, ...entries]);
    },
    [entries, persist]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<Omit<Entry, "id" | "createdAt">>) => {
      await persist(entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    },
    [entries, persist]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await persist(entries.filter((e) => e.id !== id));
    },
    [entries, persist]
  );

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();
  const noteTags = Array.from(new Set(entries.filter((e) => e.type === "note").flatMap((e) => e.tags))).sort();
  const diaryTags = Array.from(new Set(entries.filter((e) => e.type === "diary").flatMap((e) => e.tags))).sort();

  // ── web: trigger browser download ────────────────────────────────────────
  function webDownload(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

  // ── JSON export ──────────────────────────────────────────────────────────
  const exportJSON = useCallback(async () => {
    const json = JSON.stringify(entries, null, 2);
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `notlar_${ts}.json`;

    if (Platform.OS === "web") {
      webDownload(json, fileName, "application/json");
      return;
    }

    // Native: share as text — works in Expo Go without file-system write
    await Share.share({ message: json, title: fileName });
  }, [entries]);

  // ── HTML export ──────────────────────────────────────────────────────────
  const exportHTML = useCallback(async () => {
    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

    const diaryEntries = entries.filter((e) => e.type === "diary").sort((a, b) => b.date.localeCompare(a.date));
    const noteEntries = entries.filter((e) => e.type === "note").sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const renderEntry = (e: Entry) => `
      <div style="margin-bottom:28px;padding:20px;border:1px solid #E8E2D9;border-radius:12px;background:#fff;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:${e.type === "diary" ? "#FEF3E2" : "#EAF4FB"};color:${e.type === "diary" ? "#B5853A" : "#2C7CB4"};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
            ${e.type === "diary" ? "Günlük" : "Not"}
          </span>
          <span style="font-size:13px;color:#8C8C8E;">${e.type === "diary" ? e.date : e.createdAt.split("T")[0]}</span>
        </div>
        <h3 style="margin:0 0 8px 0;font-size:18px;color:#1C1C1E;">${escape(e.title)}</h3>
        <p style="margin:0 0 12px 0;font-size:15px;color:#3C3C3E;line-height:1.6;">${escape(e.content)}</p>
        ${e.tags.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${e.tags.map((t) => `<span style="font-size:12px;padding:3px 10px;border-radius:20px;background:#F2EDE6;color:#B5853A;">#${escape(t)}</span>`).join("")}</div>` : ""}
        ${e.photos.length > 0 ? `<p style="font-size:12px;color:#8C8C8E;margin-top:10px;">${e.photos.length} fotoğraf (cihaz belleğinde)</p>` : ""}
      </div>`;

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notlarım</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#FAF9F7; color:#1C1C1E; max-width:700px; margin:0 auto; padding:24px; }
  h1 { font-size:28px; margin-bottom:4px; }
  h2 { font-size:20px; margin:32px 0 16px; color:#B5853A; border-bottom:2px solid #E8E2D9; padding-bottom:8px; }
  .meta { font-size:13px; color:#8C8C8E; margin-bottom:32px; }
</style>
</head>
<body>
<h1>Notlarım</h1>
<p class="meta">Dışa aktarıldı: ${new Date().toLocaleString("tr-TR")} — Toplam ${entries.length} giriş</p>
${diaryEntries.length > 0 ? `<h2>Günlükler (${diaryEntries.length})</h2>${diaryEntries.map(renderEntry).join("")}` : ""}
${noteEntries.length > 0 ? `<h2>Notlar (${noteEntries.length})</h2>${noteEntries.map(renderEntry).join("")}` : ""}
</body>
</html>`;

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `notlar_${ts}.html`;

    if (Platform.OS === "web") {
      webDownload(html, fileName, "text/html");
      return;
    }

    await Share.share({ message: html, title: fileName });
  }, [entries]);

  // ── JSON import ──────────────────────────────────────────────────────────
  const importJSON = useCallback(
    async (mode: "replace" | "merge"): Promise<ImportResult | null> => {
      const validateEntries = (parsed: unknown[]): Entry[] =>
        parsed.filter(
          (e): e is Entry =>
            e != null &&
            typeof (e as Entry).id === "string" &&
            ((e as Entry).type === "note" || (e as Entry).type === "diary") &&
            typeof (e as Entry).title === "string"
        );

      const applyImport = async (valid: Entry[], totalParsed: number): Promise<ImportResult> => {
        if (mode === "replace") {
          await persist(valid);
          return { imported: valid.length, skipped: totalParsed - valid.length };
        }
        const existingIds = new Set(entries.map((e) => e.id));
        const incoming = valid.filter((e) => !existingIds.has(e.id));
        await persist([...incoming, ...entries]);
        return { imported: incoming.length, skipped: valid.length - incoming.length };
      };

      // Web: hidden file input
      if (Platform.OS === "web") {
        return new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json,.json";
          input.onchange = async () => {
            const webFile = input.files?.[0];
            if (!webFile) { resolve(null); return; }
            try {
              const text = await webFile.text();
              const parsed = JSON.parse(text);
              if (!Array.isArray(parsed)) throw new Error("Dizi bekleniyor");
              resolve(await applyImport(validateEntries(parsed), parsed.length));
            } catch {
              Alert.alert("Hata", "Geçersiz JSON dosyası.");
              resolve(null);
            }
          };
          input.click();
        });
      }

      // Native: document picker → XHR to read content (reliable with file:// & content:// URIs)
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return null;

      const uri = result.assets[0].uri;
      const text = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          if (xhr.status === 0 || xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Dosya okunamadı (HTTP ${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Dosya erişim hatası"));
        xhr.open("GET", uri);
        xhr.send();
      });

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("JSON formatı geçersiz. Lütfen uygulamadan dışa aktarılan bir dosya seçin.");
      }
      if (!Array.isArray(parsed)) throw new Error("Beklenen format: JSON dizisi");

      return applyImport(validateEntries(parsed as unknown[]), (parsed as unknown[]).length);
    },
    [entries, persist]
  );

  return (
    <NotesContext.Provider
      value={{ entries, isLoading, allTags, noteTags, diaryTags, addEntry, updateEntry, deleteEntry, exportJSON, exportHTML, importJSON }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes(): NotesContextType {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
