import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EntryCard } from "@/components/EntryCard";
import { Entry, useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

type TagScope = "note" | "diary";

interface TagStat {
  tag: string;
  count: number;
}

const BADGE_PALETTE = [
  { bg: "#FEF3E2", text: "#B5853A" },
  { bg: "#EAF4FB", text: "#2C7CB4" },
  { bg: "#F0EBF8", text: "#7C4DB5" },
  { bg: "#E8F7ED", text: "#2D8A4E" },
  { bg: "#FDEAEA", text: "#B53A3A" },
  { bg: "#FFF4E0", text: "#C4793A" },
  { bg: "#E6F4F1", text: "#2A8A72" },
];

function badgeColor(index: number) {
  return BADGE_PALETTE[index % BADGE_PALETTE.length];
}

export default function TagsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries } = useNotes();

  const [selectedScope, setSelectedScope] = useState<TagScope>("note");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const noteTagStats = useMemo((): TagStat[] => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      if (e.type !== "note") continue;
      for (const t of e.tags) counts[t] = (counts[t] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [entries]);

  const diaryTagStats = useMemo((): TagStat[] => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      if (e.type !== "diary") continue;
      for (const t of e.tags) counts[t] = (counts[t] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [entries]);

  const activeStats = selectedScope === "note" ? noteTagStats : diaryTagStats;

  const filteredEntries = useMemo((): Entry[] => {
    if (!selectedTag) return [];
    return entries
      .filter((e) => e.type === selectedScope && e.tags.includes(selectedTag))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, selectedTag, selectedScope]);

  const switchScope = (scope: TagScope) => {
    setSelectedScope(scope);
    setSelectedTag(null);
    Haptics.selectionAsync();
  };

  const selectTag = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Etiket İndeksi</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/entry/new${selectedScope === "diary" ? "?type=diary" : ""}`);
          }}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scope toggle */}
        <View style={styles.scopePad}>
          <View style={[styles.scopeToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Pressable
              style={[styles.scopeOption, selectedScope === "note" && { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }]}
              onPress={() => switchScope("note")}
            >
              <Feather name="file-text" size={15} color={selectedScope === "note" ? colors.noteTagText : colors.mutedForeground} />
              <Text style={[styles.scopeText, { color: selectedScope === "note" ? colors.noteTagText : colors.mutedForeground }]}>
                Notlar
              </Text>
              <View style={[styles.scopeCount, { backgroundColor: selectedScope === "note" ? colors.noteTag : "transparent" }]}>
                <Text style={[styles.scopeCountText, { color: selectedScope === "note" ? colors.noteTagText : colors.mutedForeground }]}>
                  {noteTagStats.length}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.scopeOption, selectedScope === "diary" && { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }]}
              onPress={() => switchScope("diary")}
            >
              <Feather name="book" size={15} color={selectedScope === "diary" ? colors.diaryTagText : colors.mutedForeground} />
              <Text style={[styles.scopeText, { color: selectedScope === "diary" ? colors.diaryTagText : colors.mutedForeground }]}>
                Günlükler
              </Text>
              <View style={[styles.scopeCount, { backgroundColor: selectedScope === "diary" ? colors.diaryTag : "transparent" }]}>
                <Text style={[styles.scopeCountText, { color: selectedScope === "diary" ? colors.diaryTagText : colors.mutedForeground }]}>
                  {diaryTagStats.length}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {activeStats.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="tag" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {selectedScope === "note" ? "Notlarda etiket yok" : "Günlüklerde etiket yok"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Giriş oluştururken etiket ekleyin
            </Text>
          </View>
        ) : (
          <>
            {/* Tag cloud */}
            <View style={styles.tagGridPad}>
              <View style={styles.tagGrid}>
                {activeStats.map((stat, index) => {
                  const { bg, text } = badgeColor(index);
                  const active = selectedTag === stat.tag;
                  return (
                    <Pressable
                      key={stat.tag}
                      style={({ pressed }) => [
                        styles.tagCard,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                          opacity: pressed ? 0.82 : 1,
                        },
                      ]}
                      onPress={() => selectTag(stat.tag)}
                    >
                      <View style={[styles.countBubble, { backgroundColor: active ? "rgba(255,255,255,0.22)" : bg }]}>
                        <Text style={[styles.countText, { color: active ? "#fff" : text }]}>
                          {stat.count}
                        </Text>
                      </View>
                      <Text
                        style={[styles.tagLabel, { color: active ? colors.primaryForeground : colors.foreground }]}
                        numberOfLines={1}
                      >
                        #{stat.tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Filtered list */}
            {selectedTag && (
              <View style={styles.filteredSection}>
                <View style={styles.filteredBar}>
                  <View style={styles.filteredMeta}>
                    <Text style={[styles.filteredTag, { color: colors.foreground }]}>#{selectedTag}</Text>
                    <Text style={[styles.filteredCount, { color: colors.mutedForeground }]}>
                      — {filteredEntries.length} giriş
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.clearBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => { setSelectedTag(null); Haptics.selectionAsync(); }}
                  >
                    <Feather name="x" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>Kapat</Text>
                  </Pressable>
                </View>

                {filteredEntries.length === 0 ? (
                  <View style={styles.innerEmpty}>
                    <Text style={[styles.innerEmptyText, { color: colors.mutedForeground }]}>
                      Bu etikete ait giriş bulunamadı
                    </Text>
                  </View>
                ) : (
                  <View style={styles.entryList}>
                    {filteredEntries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  scopePad: { paddingHorizontal: 16, paddingVertical: 14 },
  scopeToggle: {
    flexDirection: "row",
    borderRadius: 13,
    borderWidth: 1,
    padding: 4,
  },
  scopeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  scopeText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  scopeCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  scopeCountText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  emptyBox: { alignItems: "center", gap: 8, paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },

  tagGridPad: { paddingHorizontal: 16 },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  tagCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  countBubble: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  tagLabel: { fontSize: 14, fontFamily: "Inter_500Medium", maxWidth: 130 },

  filteredSection: { marginTop: 20, paddingHorizontal: 16 },
  filteredBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  filteredMeta: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  filteredTag: { fontSize: 18, fontFamily: "Inter_700Bold" },
  filteredCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  entryList: { gap: 0 },
  innerEmpty: { paddingVertical: 20, alignItems: "center" },
  innerEmptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
