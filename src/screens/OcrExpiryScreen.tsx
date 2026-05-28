import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { RootStackParamList } from "../types";
import { extractExpiryDateCandidates, readExpiryTextFromImage } from "../utils/ocrUtils";

type Props = NativeStackScreenProps<RootStackParamList, "OcrExpiry">;

export function OcrExpiryScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  async function processImage(uri: string): Promise<void> {
    setImageUri(uri);
    setProcessing(true);
    try {
      const text = await readExpiryTextFromImage(uri);
      const dates = extractExpiryDateCandidates(text);
      setCandidates(dates);
      if (dates.length === 0) {
        Alert.alert("自動読み取りは未対応です", "写真を登録フォームに添付します。写真を見ながら期限を入力してください。");
      }
    } catch {
      Alert.alert("写真を確認できませんでした", "もう一度撮影するか、手入力してください。");
    } finally {
      setProcessing(false);
    }
  }

  async function pickImage(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) {
      await processImage(result.assets[0].uri);
    }
  }

  async function takePhoto(): Promise<void> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("カメラの使用が許可されていません", "設定からカメラ権限を許可してください。");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) {
      await processImage(result.assets[0].uri);
    }
  }

  function useDate(date: string): void {
    navigation.replace("StockForm", { expiryDate: date, imageUri });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="期限写真を使う" subtitle="期限表示の写真を添付し、登録フォームで日付を確認します。" />
      <View style={styles.wrap}>
        <View style={styles.card}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>期限表示の写真を撮影、または選択してください</Text></View>}
          <View style={styles.actions}>
            <PrimaryButton title="撮影する" onPress={() => void takePhoto()} />
            <PrimaryButton title="画像を選ぶ" variant="soft" onPress={() => void pickImage()} />
          </View>
          {processing ? <Text style={styles.note}>写真を確認中です...</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>期限候補</Text>
          {candidates.length === 0 ? (
            <Text style={styles.note}>現在は自動読み取りに対応していません。写真を添付して、次の画面で期限を手入力してください。</Text>
          ) : candidates.map((candidate) => (
            <Pressable key={candidate} style={styles.dateButton} onPress={() => useDate(candidate)}>
              <Text style={styles.dateText}>{candidate}</Text>
              <Text style={styles.useText}>この日付を使う</Text>
            </Pressable>
          ))}
          {imageUri ? <PrimaryButton title="写真を添付して手入力へ" onPress={() => navigation.replace("StockForm", { imageUri })} /> : null}
          <PrimaryButton title="もう一度撮影" variant="soft" onPress={() => void takePhoto()} />
          <PrimaryButton title="手入力する" variant="soft" onPress={() => navigation.replace("StockForm")} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 12 },
  image: { width: "100%", height: 220, borderRadius: 8, backgroundColor: colors.muted },
  placeholder: { height: 180, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", padding: 16 },
  placeholderText: { color: colors.textSub, fontSize: 15, fontWeight: "800", textAlign: "center" },
  actions: { gap: 8 },
  sectionTitle: { color: colors.textMain, fontSize: 18, fontWeight: "900" },
  note: { color: colors.textSub, fontSize: 14, lineHeight: 20 },
  dateButton: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, gap: 4 },
  dateText: { color: colors.textMain, fontSize: 18, fontWeight: "900" },
  useText: { color: colors.primary, fontSize: 13, fontWeight: "900" }
});
