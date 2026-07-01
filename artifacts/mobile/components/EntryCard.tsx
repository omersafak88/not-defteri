import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Entry } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

interface EntryCardProps {
  entry: Entry;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function EntryCard({ entry }: EntryCardProps) {
  const colors = useColors();
  const router = useRouter();

  const displayDate = entry.type === "diary" ? entry.date : entry.createdAt.split("T")[0];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => router.push(`/entry/${entry.id}`)}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: entry.type === "diary" ? colors.diaryTag : colors.noteTag }]}>
          <Text style={[styles.typeText, { color: entry.type === "diary" ? colors.diaryTagText : colors.noteTagText }]}>
            {entry.type === "diary" ? "Günlük" : "Not"}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(displayDate)}</Text>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
        {entry.title}
      </Text>

      {entry.content.length > 0 && (
        <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>
          {entry.content}
        </Text>
      )}

      {entry.photos.length > 0 && (
        <View style={styles.photosRow}>
          {entry.photos.slice(0, 3).map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={[styles.photoThumb, { borderColor: colors.border }]}
              contentFit="cover"
            />
          ))}
          {entry.photos.length > 3 && (
            <View style={[styles.morePhotos, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.morePhotosText, { color: colors.mutedForeground }]}>+{entry.photos.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {entry.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {entry.tags.slice(0, 4).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
            </View>
          ))}
          {entry.tags.length > 4 && (
            <Text style={[styles.moreTags, { color: colors.mutedForeground }]}>+{entry.tags.length - 4}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    lineHeight: 22,
  },
  preview: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 8,
  },
  photosRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  photoThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
  },
  morePhotos: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  morePhotosText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  moreTags: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    alignSelf: "center",
  },
});
