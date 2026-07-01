import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EntryCard } from "@/components/EntryCard";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "all" | "note" | "diary";

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, isLoading } = useNotes();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = entries;
    if (filterType !== "all") result = result.filter((e) => e.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, filterType, search]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function TypeChip({ label, value }: { label: string; value: FilterType }) {
    const active = filterType === value;
    return (
      <Pressable
        style={[
          styles.typeChip,
          {
            backgroundColor: active ? colors.primary : colors.secondary,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setFilterType(value);
        }}
      >
        <Text style={[styles.typeChipText, { color: active ? colors.primaryForeground : colors.secondaryForeground }]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notlarım</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/entry/new");
          }}
        >
          <Text style={[styles.addIcon, { color: colors.primaryForeground }]}>+</Text>
        </Pressable>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Ara..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Text style={[styles.clearX, { color: colors.mutedForeground }]}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.typeRow, { backgroundColor: colors.background }]}>
        <TypeChip label="Tümü" value="all" />
        <TypeChip label="Notlar" value="note" />
        <TypeChip label="Günlükler" value="diary" />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="book-open" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {entries.length === 0 ? "Henüz not yok" : "Eşleşme bulunamadı"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            {entries.length === 0 ? "Yeni bir not veya günlük ekleyin" : "Farklı filtreler deneyin"}
          </Text>
          {entries.length === 0 && (
            <Pressable
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/entry/new")}
            >
              <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>Yeni Giriş</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryCard entry={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90 },
          ]}
          showsVerticalScrollIndicator={false}
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
  addIcon: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: "Inter_400Regular",
    includeFontPadding: false,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  clearX: {
    fontSize: 13,
    lineHeight: 18,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
