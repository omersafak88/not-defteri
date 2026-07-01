import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Share } from "react-native";

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
}

const STORAGE_KEY = "notlar_entries_v1";

const NotesContext = createContext<NotesContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Entry[];
          setEntries(parsed);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (updated: Entry[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEntries(updated);
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<Entry, "id" | "createdAt">) => {
      const newEntry: Entry = {
        ...entry,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...entries];
      await persist(updated);
    },
    [entries, persist]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<Omit<Entry, "id" | "createdAt">>) => {
      const updated = entries.map((e) => (e.id === id ? { ...e, ...updates } : e));
      await persist(updated);
    },
    [entries, persist]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      await persist(updated);
    },
    [entries, persist]
  );

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();
  const noteTags = Array.from(new Set(entries.filter((e) => e.type === "note").flatMap((e) => e.tags))).sort();
  const diaryTags = Array.from(new Set(entries.filter((e) => e.type === "diary").flatMap((e) => e.tags))).sort();

  const exportJSON = useCallback(async () => {
    const json = JSON.stringify(entries, null, 2);
    await Share.share({
      message: json,
      title: "Notlar Yedek (JSON)",
    });
  }, [entries]);

  const exportHTML = useCallback(async () => {
    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

    const diaryEntries = entries
      .filter((e) => e.type === "diary")
      .sort((a, b) => b.date.localeCompare(a.date));
    const noteEntries = entries
      .filter((e) => e.type === "note")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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

    await Share.share({
      message: html,
      title: "Notlar (HTML)",
    });
  }, [entries]);

  return (
    <NotesContext.Provider
      value={{ entries, isLoading, allTags, noteTags, diaryTags, addEntry, updateEntry, deleteEntry, exportJSON, exportHTML }}
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
