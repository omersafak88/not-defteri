import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, exportJSON, exportHTML, importJSON } = useNotes();
  const [loadingJSON, setLoadingJSON] = useState(false);
  const [loadingHTML, setLoadingHTML] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const handleExportJSON = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingJSON(true);
    try {
      await exportJSON();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("Hata", `Dışa aktarma başarısız:\n${msg}`);
    } finally {
      setLoadingJSON(false);
    }
  };

  const handleExportHTML = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingHTML(true);
    try {
      await exportHTML();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("Hata", `Dışa aktarma başarısız:\n${msg}`);
    } finally {
      setLoadingHTML(false);
    }
  };

  const handleImport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "JSON İçe Aktar",
      "Mevcut verilerle ne yapmak istersiniz?",
      [
        {
          text: "Birleştir",
          onPress: () => runImport("merge"),
        },
        {
          text: "Tümünü Değiştir",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Emin misiniz?",
              "Mevcut tüm notlar ve günlükler silinecek, yerine JSON'daki veriler gelecek.",
              [
                { text: "İptal", style: "cancel" },
                { text: "Değiştir", style: "destructive", onPress: () => runImport("replace") },
              ]
            );
          },
        },
        { text: "İptal", style: "cancel" },
      ]
    );
  };

  const runImport = async (mode: "replace" | "merge") => {
    setLoadingImport(true);
    try {
      const result = await importJSON(mode);
      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "İçe Aktarma Tamamlandı",
          `${result.imported} giriş eklendi${result.skipped > 0 ? `, ${result.skipped} zaten mevcut` : ""}.`
        );
      }
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Dosya okunamadı veya geçersiz format.");
    } finally {
      setLoadingImport(false);
    }
  };

  const diaryCount = entries.filter((e) => e.type === "diary").length;
  const noteCount = entries.filter((e) => e.type === "note").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Ayarlar</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
      >
        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statsTitle, { color: colors.mutedForeground }]}>Genel Bakış</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{entries.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Toplam</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.diaryTagText }]}>{diaryCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Günlük</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.noteTagText }]}>{noteCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Not</Text>
            </View>
          </View>
        </View>

        {/* Export */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Dışa Aktarma</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleExportJSON}
            disabled={loadingJSON || entries.length === 0}
          >
            <View style={[styles.rowIcon, { backgroundColor: "#EAF4FB" }]}>
              {loadingJSON ? (
                <ActivityIndicator size="small" color="#2C7CB4" />
              ) : (
                <Feather name="download" size={18} color="#2C7CB4" />
              )}
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: entries.length === 0 ? colors.mutedForeground : colors.foreground }]}>
                JSON olarak dışa aktar
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                Yedekleme ve cihaz taşıma için
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleExportHTML}
            disabled={loadingHTML || entries.length === 0}
          >
            <View style={[styles.rowIcon, { backgroundColor: "#FEF3E2" }]}>
              {loadingHTML ? (
                <ActivityIndicator size="small" color="#B5853A" />
              ) : (
                <Feather name="file-text" size={18} color="#B5853A" />
              )}
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: entries.length === 0 ? colors.mutedForeground : colors.foreground }]}>
                HTML olarak dışa aktar
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                Okunabilir belge formatı
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {entries.length === 0 && (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Dışa aktarmak için önce bir giriş ekleyin.
          </Text>
        )}

        {/* Import */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>İçe Aktarma</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleImport}
            disabled={loadingImport}
          >
            <View style={[styles.rowIcon, { backgroundColor: "#E8F7ED" }]}>
              {loadingImport ? (
                <ActivityIndicator size="small" color="#2D8A4E" />
              ) : (
                <Feather name="upload" size={18} color="#2D8A4E" />
              )}
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                JSON'dan içe aktar
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                Yedek dosyasından verileri geri yükle
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Birleştir: mevcut verilere ekler, tekrarlananları atlar.{"\n"}
          Tümünü Değiştir: mevcut verileri siler, yerine yükler.
        </Text>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Hakkında</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="smartphone" size={18} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Yerel Depolama</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                Veriler yalnızca bu cihazda saklanır
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="lock" size={18} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Gizlilik</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                Hiçbir dış servise veri gönderilmez
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 0,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, height: 40 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
    lineHeight: 18,
  },
});
