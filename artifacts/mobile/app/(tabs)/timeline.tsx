import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Entry, useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function formatDay(dateStr: string): { day: string; weekday: string } {
  const [year, month, day] = dateStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return {
    day: day.replace(/^0/, ""),
    weekday: d.toLocaleDateString("tr-TR", { weekday: "short" }),
  };
}

interface Section {
  title: string;
  data: Entry[];
}

export default function TimelineScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, isLoading } = useNotes();

  const sections: Section[] = useMemo(() => {
    const diary = entries
      .filter((e) => e.type === "diary")
      .sort((a, b) => b.date.localeCompare(a.date));

    const byMonth: Record<string, Entry[]> = {};
    for (const e of diary) {
      const key = e.date.substring(0, 7);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(e);
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => ({ title: formatMonthYear(key + "-01"), data }));
  }, [entries]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const renderItem = ({ item, index, section }: { item: Entry; index: number; section: Section }) => {
    const { day, weekday } = formatDay(item.date);
    const isLast = index === section.data.length - 1;

    return (
      <Pressable
        style={({ pressed }) => [styles.timelineItem, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/entry/${item.id}`);
        }}
      >
        <View style={styles.timelineLine}>
          <View style={[styles.dateBubble, { backgroundColor: colors.primary }]}>
            <Text style={[styles.dateDay, { color: colors.primaryForeground }]}>{day}</Text>
            <Text style={[styles.dateWeekday, { color: colors.primaryForeground }]}>{weekday}</Text>
          </View>
          {!isLast && <View style={[styles.connector, { backgroundColor: colors.border }]} />}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.content.length > 0 && (
            <Text style={[styles.cardContent, { color: colors.mutedForeground }]} numberOfLines={3}>
              {item.content}
            </Text>
          )}
          <View style={styles.cardFooter}>
            {item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.diaryTag }]}>
                    <Text style={[styles.tagText, { color: colors.diaryTagText }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            {item.photos.length > 0 && (
              <View style={styles.photoInfo}>
                <Feather name="image" size={12} color={colors.mutedForeground} />
                <Text style={[styles.photoCount, { color: colors.mutedForeground }]}>{item.photos.length}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Zaman Çizelgesi</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/entry/new?type=diary");
          }}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Feather name="calendar" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz günlük yok</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Günlük ekleyerek geçmiş günlerinizi takip edin
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/entry/new?type=diary");
            }}
          >
            <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>Günlük Ekle</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionHeaderText, { color: colors.primary }]}>{title}</Text>
            </View>
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 16,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  list: {
    paddingTop: 4,
  },
  timelineItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  timelineLine: {
    alignItems: "center",
    width: 56,
    marginRight: 12,
  },
  dateBubble: {
    width: 48,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  dateWeekday: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 12,
    marginTop: 4,
    borderRadius: 1,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  photoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  photoCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
