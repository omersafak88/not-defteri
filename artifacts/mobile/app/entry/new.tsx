import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function NewEntryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const { addEntry } = useNotes();

  const [type, setType] = useState<"note" | "diary">(typeParam === "diary" ? "diary" : "note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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

  const handleSave = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addEntry({ type, title: title.trim(), content, tags, photos, date });
    setSaving(false);
    router.back();
  };

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
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Yeni Giriş</Text>
        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Kaydet</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Pressable
            style={[styles.typeOption, type === "note" && { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }]}
            onPress={() => { setType("note"); Haptics.selectionAsync(); }}
          >
            <Feather name="file-text" size={15} color={type === "note" ? colors.noteTagText : colors.mutedForeground} />
            <Text style={[styles.typeOptionText, { color: type === "note" ? colors.noteTagText : colors.mutedForeground }]}>Not</Text>
          </Pressable>
          <Pressable
            style={[styles.typeOption, type === "diary" && { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }]}
            onPress={() => { setType("diary"); Haptics.selectionAsync(); }}
          >
            <Feather name="book" size={15} color={type === "diary" ? colors.diaryTagText : colors.mutedForeground} />
            <Text style={[styles.typeOptionText, { color: type === "diary" ? colors.diaryTagText : colors.mutedForeground }]}>Günlük</Text>
          </Pressable>
        </View>

        {/* Date (diary only) */}
        {type === "diary" && (
          <View style={[styles.fieldRow, { borderColor: colors.border }]}>
            <Feather name="calendar" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.dateInput, { color: colors.foreground }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-AA-GG"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        )}

        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
          placeholder="Başlık"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          returnKeyType="next"
        />

        {/* Content */}
        <TextInput
          style={[styles.contentInput, { color: colors.foreground }]}
          placeholder={type === "diary" ? "Bugün ne oldu?" : "Notunuzu buraya yazın..."}
          placeholderTextColor={colors.mutedForeground}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {/* Tags */}
        <View style={[styles.fieldSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Etiketler</Text>
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
          {tags.length > 0 && (
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={[styles.tagChipText, { color: colors.primary }]}>#{tag}</Text>
                  <Feather name="x" size={12} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Photos */}
        <View style={[styles.fieldSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Fotoğraflar</Text>
          <View style={styles.photosGrid}>
            {photos.map((uri) => (
              <View key={uri} style={styles.photoWrapper}>
                <Image source={{ uri }} style={[styles.photo, { borderColor: colors.border }]} contentFit="cover" />
                <Pressable
                  style={[styles.removePhoto, { backgroundColor: colors.destructive }]}
                  onPress={() => removePhoto(uri)}
                >
                  <Feather name="x" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable
              style={[styles.addPhotoButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={pickPhoto}
            >
              <Feather name="image" size={22} color={colors.mutedForeground} />
              <Text style={[styles.addPhotoText, { color: colors.mutedForeground }]}>Ekle</Text>
            </Pressable>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: { padding: 4 },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  titleInput: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    minHeight: 160,
    paddingVertical: 12,
  },
  fieldSection: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tagInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  tagTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addTagButton: {
    width: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoWrapper: { position: "relative" },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
  },
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
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
