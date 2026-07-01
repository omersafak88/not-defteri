import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

export default function EntryDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, updateEntry, deleteEntry } = useNotes();

  const entry = entries.find((e) => e.id === id);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [photos, setPhotos] = useState<string[]>(entry?.photos ?? []);
  const [tagInput, setTagInput] = useState("");
  const [date, setDate] = useState(entry?.date ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setTags(entry.tags);
      setPhotos(entry.photos);
      setDate(entry.date);
    }
  }, [entry?.id]);

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Giriş bulunamadı</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Başlık gerekli", "Lütfen bir başlık girin.");
      return;
    }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateEntry(id, { title: title.trim(), content, tags, photos, date });
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert("Sil", "Bu girişi silmek istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await deleteEntry(id);
          router.back();
        },
      },
    ]);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      Haptics.selectionAsync();
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    Haptics.selectionAsync();
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin gerekli", "Fotoğraf eklemek için galeri erişimine izin verin.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos([...photos, ...uris]);
      Haptics.selectionAsync();
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos(photos.filter((p) => p !== uri));
    Haptics.selectionAsync();
  };

  const displayDate = entry.type === "diary" ? entry.date : entry.createdAt.split("T")[0];
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => { if (editing) { setEditing(false); setTitle(entry.title); setContent(entry.content); setTags(entry.tags); setPhotos(entry.photos); setDate(entry.date); } else { router.back(); } }} style={styles.headerButton}>
          <Feather name={editing ? "x" : "arrow-left"} size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerMeta}>
          <View style={[styles.typeBadge, { backgroundColor: entry.type === "diary" ? colors.diaryTag : colors.noteTag }]}>
            <Text style={[styles.typeBadgeText, { color: entry.type === "diary" ? colors.diaryTagText : colors.noteTagText }]}>
              {entry.type === "diary" ? "Günlük" : "Not"}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {editing ? (
            <Pressable style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Kaydet</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => setEditing(true)} style={styles.headerButton}>
                <Feather name="edit-2" size={20} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={handleDelete} style={styles.headerButton}>
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        {editing && entry.type === "diary" ? (
          <View style={[styles.dateRow, { borderColor: colors.border }]}>
            <Feather name="calendar" size={15} color={colors.mutedForeground} />
            <TextInput style={[styles.dateInput, { color: colors.foreground }]} value={date} onChangeText={setDate} placeholder="YYYY-AA-GG" placeholderTextColor={colors.mutedForeground} />
          </View>
        ) : (
          <View style={styles.dateReadRow}>
            <Feather name="calendar" size={14} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatDate(displayDate)}</Text>
          </View>
        )}

        {/* Title */}
        {editing ? (
          <TextInput
            style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Başlık"
            placeholderTextColor={colors.mutedForeground}
            maxLength={120}
          />
        ) : (
          <Text style={[styles.titleText, { color: colors.foreground }]}>{entry.title}</Text>
        )}

        {/* Content */}
        {editing ? (
          <TextInput
            style={[styles.contentInput, { color: colors.foreground }]}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholder="İçerik..."
            placeholderTextColor={colors.mutedForeground}
          />
        ) : (
          <Text style={[styles.contentText, { color: colors.foreground }]}>
            {entry.content || <Text style={{ color: colors.mutedForeground }}>(İçerik yok)</Text>}
          </Text>
        )}

        {/* Photos */}
        {(photos.length > 0 || editing) && (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Fotoğraflar</Text>
            <View style={styles.photosGrid}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={[styles.photo, { borderColor: colors.border }]} contentFit="cover" />
                  {editing && (
                    <Pressable style={[styles.removePhoto, { backgroundColor: colors.destructive }]} onPress={() => removePhoto(uri)}>
                      <Feather name="x" size={12} color="#fff" />
                    </Pressable>
                  )}
                </View>
              ))}
              {editing && (
                <Pressable style={[styles.addPhotoButton, { backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={pickPhoto}>
                  <Feather name="image" size={22} color={colors.mutedForeground} />
                  <Text style={[styles.addPhotoText, { color: colors.mutedForeground }]}>Ekle</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Tags */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Etiketler</Text>
          {editing && (
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.tagTextInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
                placeholder="Etiket ekle..."
                placeholderTextColor={colors.mutedForeground}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCapitalize="none"
              />
              <Pressable style={[styles.addTagButton, { backgroundColor: colors.primary }]} onPress={addTag}>
                <Feather name="plus" size={18} color={colors.primaryForeground} />
              </Pressable>
            </View>
          )}
          {tags.length > 0 ? (
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={editing ? () => removeTag(tag) : undefined}
                >
                  <Text style={[styles.tagChipText, { color: colors.primary }]}>#{tag}</Text>
                  {editing && <Feather name="x" size={12} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          ) : (
            !editing && <Text style={[styles.noTags, { color: colors.mutedForeground }]}>Etiket yok</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerButton: { padding: 4 },
  headerMeta: { flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
  typeBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  dateInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  dateReadRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  dateText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  titleText: { fontSize: 24, fontFamily: "Inter_700Bold", lineHeight: 30, marginBottom: 16 },
  titleInput: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  contentText: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 26 },
  contentInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
    minHeight: 160,
    paddingVertical: 10,
  },
  section: {
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoWrapper: { position: "relative" },
  photo: { width: 90, height: 90, borderRadius: 10, borderWidth: 1 },
  removePhoto: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tagInputRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tagTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addTagButton: { width: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  noTags: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
