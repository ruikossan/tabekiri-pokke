import React, { useRef, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { categories } from "../constants/categories";
import { locations } from "../constants/locations";
import { FormInput } from "../components/FormInput";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectButtonGroup } from "../components/SelectButtonGroup";
import { RootStackParamList, ShoppingTemplate, StockItem } from "../types";
import { useAppData } from "../services/AppDataContext";
import { addStockFromFavorite, calculateExpiryDate, findFavoriteByBarcode, formatDefaultExpiryLabel } from "../utils/favoriteItemUtils";
import { isDuplicateRecentScan } from "../utils/scanUtils";

type Props = NativeStackScreenProps<RootStackParamList, "ContinuousScan">;

type ScanEntry = {
  id: string;
  barcode: string;
  scannedAt: string;
  scanImageUri?: string;
  template?: ShoppingTemplate;
};

type EditForm = {
  id: string;
  barcode: string;
  scanIndex: number;
  scannedAt: string;
  scanImageUri?: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  location: string;
  defaultExpiryDays: string;
  memo: string;
};

function templateFromEntry(entry: ScanEntry): ShoppingTemplate | undefined {
  return entry.template;
}

function formatScannedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

export function ContinuousScanScreen({ navigation }: Props) {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [scanMemory, setScanMemory] = useState<Record<string, ShoppingTemplate>>({});
  const [editing, setEditing] = useState<EditForm | undefined>(undefined);
  const { shoppingTemplates, addStockItem, addStockHistoryItem, showToast } = useAppData();

  function handleScanned(result: BarcodeScanningResult): void {
    void handleScannedAsync(result);
  }

  async function handleScannedAsync(result: BarcodeScanningResult): Promise<void> {
    const barcode = result.data.trim();
    if (!barcode || isDuplicateRecentScan(barcode)) return;

    const scanImageUri = await captureScanImage();
    const favorite = findFavoriteByBarcode(shoppingTemplates, barcode) ?? scanMemory[barcode];
    const existing = entries.find((entry) => entry.barcode === barcode);
    if (existing) {
      const label = existing.template?.name ?? favorite?.name ?? "未登録商品";
      Alert.alert(`${label}はすでに読み取り済みです。`, "数量を1増やしますか？", [
        { text: "増やす", onPress: () => incrementEntry(existing.id) },
        { text: "別の商品として追加", onPress: () => appendEntry(barcode, favorite, scanImageUri) },
        { text: "キャンセル", style: "cancel" }
      ]);
      return;
    }

    appendEntry(barcode, favorite, scanImageUri);
  }

  async function captureScanImage(): Promise<string | undefined> {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.35, skipProcessing: true });
      return photo?.uri;
    } catch {
      return undefined;
    }
  }

  function appendEntry(barcode: string, template?: ShoppingTemplate, scanImageUri?: string): void {
    setEntries((current) => [
      ...current,
      {
        id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        barcode,
        scannedAt: new Date().toISOString(),
        scanImageUri,
        template
      }
    ]);
  }

  function incrementEntry(id: string): void {
    setEntries((current) => current.map((entry) => {
      if (entry.id !== id || !entry.template) return entry;
      return { ...entry, template: { ...entry.template, quantity: entry.template.quantity + 1 } };
    }));
  }

  function removeEntry(id: string): void {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function openEdit(entry: ScanEntry): void {
    const template = entry.template ?? scanMemory[entry.barcode];
    const scanIndex = entries.findIndex((current) => current.id === entry.id) + 1;
    setEditing({
      id: entry.id,
      barcode: entry.barcode,
      scanIndex,
      scannedAt: entry.scannedAt,
      scanImageUri: entry.scanImageUri,
      name: template?.name ?? "",
      quantity: String(template?.quantity ?? 1),
      unit: template?.unit ?? "個",
      category: template?.category ?? "その他",
      location: template?.location ?? "冷蔵庫",
      defaultExpiryDays: String(template?.defaultExpiryDays ?? 7),
      memo: template?.memo ?? ""
    });
  }

  function saveEdit(): void {
    if (!editing) return;

    const quantity = Number(editing.quantity);
    const defaultExpiryDays = Number(editing.defaultExpiryDays);
    if (!editing.name.trim() || Number.isNaN(quantity) || quantity <= 0) {
      Alert.alert("入力エラー", "品名と正しい数量を入力してください。");
      return;
    }
    if (Number.isNaN(defaultExpiryDays) || defaultExpiryDays < 0) {
      Alert.alert("入力エラー", "賞味期限目安は0以上の日数で入力してください。");
      return;
    }

    const now = new Date().toISOString();
    const rememberedTemplate: ShoppingTemplate = {
      id: `scan-template-${editing.id}`,
      name: editing.name.trim(),
      quantity,
      unit: editing.unit.trim() || "個",
      category: editing.category,
      location: editing.location,
      defaultExpiryDays,
      barcode: editing.barcode,
      memo: editing.memo.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    setEntries((current) => current.map((entry) => entry.id === editing.id ? { ...entry, template: rememberedTemplate } : entry));
    setScanMemory((current) => ({ ...current, [editing.barcode]: rememberedTemplate }));
    setEditing(undefined);
  }

  async function addAll(): Promise<void> {
    const unresolved = entries.filter((entry) => !templateFromEntry(entry)?.name?.trim());
    if (unresolved.length > 0) {
      Alert.alert("未入力の商品があります", "商品情報を入力してから登録してください。");
      return;
    }

    try {
      for (const entry of entries) {
        const template = templateFromEntry(entry);
        if (!template) continue;
        const item: StockItem = addStockFromFavorite(template);
        await addStockItem(item);
        await addStockHistoryItem({
          id: `history-${Date.now()}-${entry.id}`,
          type: "購入",
          stockItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          createdAt: new Date().toISOString()
        });
      }
      showToast(`${entries.length}件の食品を追加しました`);
      navigation.goBack();
    } catch {
      Alert.alert("保存エラー", "まとめて登録できませんでした。");
    }
  }

  if (!permission) {
    return <View style={styles.center}><Text style={styles.text}>カメラ権限を確認しています。</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>カメラの使用が許可されていません。</Text>
        <Text style={styles.text}>設定からカメラ権限を許可してください。</Text>
        <PrimaryButton title="カメラを許可する" onPress={() => void requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleScanned}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "itf14", "qr"] }}
      />

      <View style={styles.panel}>
        <Header title="連続スキャン" subtitle="読み取った商品を下にためて、最後にまとめて登録します。" />
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionTitle}>読み取り済み</Text>
          {entries.length === 0 ? <Text style={styles.empty}>まだ読み取っていません。</Text> : entries.map((entry, index) => {
            const template = templateFromEntry(entry);
            return (
              <View key={entry.id} style={styles.card}>
                <Text style={styles.name}>{index + 1}. {template?.name || "未登録商品"}</Text>
                <Text style={styles.scanMeta}>読み取り {index + 1} / {formatScannedAt(entry.scannedAt)} / {entry.barcode}</Text>
                {template ? (
                  <Text style={styles.meta}>
                    {template.quantity}{template.unit} / {template.category ?? "カテゴリ未設定"} / {template.location ?? "保管場所未設定"} / 期限：{template.defaultExpiryDays !== undefined ? calculateExpiryDate(template.defaultExpiryDays) : "未設定"}
                  </Text>
                ) : (
                  <Text style={styles.meta}>商品情報を入力してください。</Text>
                )}
                <View style={styles.actions}>
                  <Pressable style={styles.softButton} onPress={() => openEdit(entry)}>
                    <Text style={styles.softButtonText}>{template ? "編集" : "内容を入力"}</Text>
                  </Pressable>
                  <Pressable style={styles.deleteButton} onPress={() => removeEntry(entry.id)}>
                    <Text style={styles.deleteText}>削除</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          <PrimaryButton title="まとめて登録" onPress={() => void addAll()} disabled={entries.length === 0} />
        </ScrollView>
      </View>

      <Modal transparent visible={editing !== undefined} animationType="fade" onRequestClose={() => setEditing(undefined)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditing(undefined)} />
          <View style={styles.editSheet}>
            <Text style={styles.editTitle}>商品情報を入力</Text>
            {editing ? (
              <ScrollView contentContainerStyle={styles.editContent}>
                <View style={styles.scanMemoryBox}>
                  {editing.scanImageUri ? <Image source={{ uri: editing.scanImageUri }} style={styles.editScanImage} /> : null}
                  <Text style={styles.scanMemoryTitle}>読み取りメモ</Text>
                  <Text style={styles.scanMemoryText}>順番：{editing.scanIndex}番目</Text>
                  <Text style={styles.scanMemoryText}>時刻：{formatScannedAt(editing.scannedAt)}</Text>
                  <Text style={styles.scanMemoryText}>バーコード：{editing.barcode}</Text>
                </View>
                <FormInput label="品名" value={editing.name} onChangeText={(value) => setEditing({ ...editing, name: value })} placeholder="例：牛乳" />
                <View style={styles.row}>
                  <View style={styles.quantityField}>
                    <FormInput label="数量" value={editing.quantity} onChangeText={(value) => setEditing({ ...editing, quantity: value })} keyboardType="numeric" />
                  </View>
                  <View style={styles.unitField}>
                    <FormInput label="単位" value={editing.unit} onChangeText={(value) => setEditing({ ...editing, unit: value })} />
                  </View>
                </View>
                <Text style={styles.groupLabel}>カテゴリ</Text>
                <SelectButtonGroup options={categories} value={editing.category} onChange={(value) => setEditing({ ...editing, category: value })} />
                <Text style={styles.groupLabel}>保管場所</Text>
                <SelectButtonGroup options={locations} value={editing.location} onChange={(value) => setEditing({ ...editing, location: value })} />
                <FormInput label="賞味期限目安（日）" value={editing.defaultExpiryDays} onChangeText={(value) => setEditing({ ...editing, defaultExpiryDays: value })} keyboardType="numeric" />
                <Text style={styles.hint}>目安：{formatDefaultExpiryLabel(Number(editing.defaultExpiryDays))}</Text>
                <FormInput label="メモ" value={editing.memo} onChangeText={(value) => setEditing({ ...editing, memo: value })} multiline />
                <PrimaryButton title="リストに反映" onPress={saveEdit} />
                <PrimaryButton title="キャンセル" variant="soft" onPress={() => setEditing(undefined)} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.textMain },
  camera: { flex: 1 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  title: { color: colors.textMain, fontSize: 22, fontWeight: "900", textAlign: "center" },
  text: { color: colors.textSub, fontSize: 15, textAlign: "center", lineHeight: 22 },
  panel: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "58%", backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  sectionTitle: { color: colors.textMain, fontSize: 17, fontWeight: "900" },
  empty: { color: colors.textSub, fontSize: 14, fontWeight: "700" },
  card: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 },
  name: { color: colors.textMain, fontSize: 16, fontWeight: "900" },
  scanMeta: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  meta: { color: colors.textSub, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  softButton: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  softButtonText: { color: colors.primary, fontWeight: "900" },
  deleteButton: { paddingHorizontal: 8, paddingVertical: 7 },
  deleteText: { color: colors.danger, fontWeight: "900" },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: "flex-end" },
  editSheet: { maxHeight: "86%", backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  editTitle: { color: colors.textMain, fontSize: 20, fontWeight: "900", marginBottom: 12 },
  editContent: { gap: 12, paddingBottom: 18 },
  scanMemoryBox: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, gap: 4 },
  editScanImage: { width: "100%", height: 160, borderRadius: 8, backgroundColor: colors.muted, marginBottom: 6 },
  scanMemoryTitle: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  scanMemoryText: { color: colors.textMain, fontSize: 13, fontWeight: "800" },
  row: { flexDirection: "row", gap: 10 },
  quantityField: { flex: 1 },
  unitField: { width: 104 },
  groupLabel: { color: colors.textMain, fontSize: 15, fontWeight: "800" },
  hint: { color: colors.textSub, fontSize: 13, fontWeight: "700" }
});
