import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EntryCard } from "@/components/EntryCard";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

interface TagStat {
  tag: string;
  count: number;
}

export default function TagsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, isLoading } = useNotes();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const tagStats: TagStat[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      for (const tag of entry.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!selectedTag) return [];
    return entries
      .filter((e) => e.tags.includes(selectedTag))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, selectedTag]);

  const totalTagged = useMemo(
    () => entries.filter((e) => e.tags.length > 0).length,
    [entries]
  );

  const BADGE_COLORS = [
    { bg: "#FEF3E2", text: "#B5853A" },
    { bg: "#EAF4FB", text: "#2C7CB4" },
    { bg: "#F0EBF8", text: "#7C4DB5" },
    { bg: "#E8F7ED", text: "#2D8A4E" },
    { bg: "#FDEAEA", text: "#B53A3A" },
  ];

  function getBadgeColor(index: number) {
    return BADGE_COLORS[index % BADGE_COLORS.length];
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            router.push("/entry/new");
          }}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {tagStats.length === 0 ? (
        <View style={styles.center}>
          <Feather name="tag" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz etiket yok</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Girişlerinize etiket ekleyerek burada görüntüleyin
          </Text>
        </View>
      ) : (
        <FlatList
          data={selectedTag ? filteredEntries : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryCard entry={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Summary row */}
              <View style={[styles.summaryRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.foreground }]}>{tagStats.length}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Etiket</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.foreground }]}>{totalTagged}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Etiketli Giriş</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.foreground }]}>{entries.length}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Toplam</Text>
                </View>
              </View>

              {/* Tag grid */}
              <View style={styles.tagGrid}>
                {tagStats.map((stat, index) => {
                  const { bg, text } = getBadgeColor(index);
                  const active = selectedTag === stat.tag;
                  return (
                    <Pressable
                      key={stat.tag}
                      style={({ pressed }) => [
                        styles.tagCard,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedTag(active ? null : stat.tag);
                      }}
                    >
                      <View style={[styles.tagBadge, { backgroundColor: active ? "rgba(255,255,255,0.2)" : bg }]}>
                        <Text style={[styles.tagBadgeText, { color: active ? "#fff" : text }]}>
                          {stat.count}
                        </Text>
                      </View>
                      <Text
                        style={[styles.tagName, { color: active ? colors.primaryForeground : colors.foreground }]}
                        numberOfLines={1}
                      >
                        #{stat.tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Selected tag header */}
              {selectedTag && (
                <View style={styles.filteredHeader}>
                  <View style={styles.filteredTitleRow}>
                    <Text style={[styles.filteredTitle, { color: colors.foreground }]}>
                      #{selectedTag}
                    </Text>
                    <Text style={[styles.filteredCount, { color: colors.mutedForeground }]}>
                      {filteredEntries.length} giriş
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.clearButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedTag(null);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.clearButtonText, { color: colors.mutedForeground }]}>Temizle</Text>
                  </Pressable>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            selectedTag ? (
              <View style={styles.innerEmpty}>
                <Text style={[styles.innerEmptyText, { color: colors.mutedForeground }]}>Bu etikete ait giriş yok</Text>
              </View>
            ) : null
          }
        />
      )}
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
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  listContent: {
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 16,
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  summaryNumber: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
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
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tagBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tagBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  tagName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    maxWidth: 120,
  },
  filteredHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  filteredTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  filteredTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  filteredCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  innerEmpty: {
    paddingVertical: 24,
    alignItems: "center",
  },
  innerEmptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
