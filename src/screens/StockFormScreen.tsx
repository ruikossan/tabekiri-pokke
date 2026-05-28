import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { categories } from "../constants/categories";
import { colors } from "../constants/colors";
import { locations } from "../constants/locations";
import { getDefaultUnitForCategory, getUnitOptionsForCategory } from "../constants/units";
import { CalendarDatePicker } from "../components/CalendarDatePicker";
import { FormInput } from "../components/FormInput";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectButtonGroup } from "../components/SelectButtonGroup";
import { RootStackParamList, StockItem } from "../types";
import { useAppData } from "../services/AppDataContext";
import { isValidDateInput } from "../utils/dateInputUtils";
import { canAddStockItem, currentPlan } from "../utils/featureGate";
import {
  calculateDefaultExpiryDays,
  calculateExpiryDate,
  createFavoriteFromStock,
  findFavoriteByName,
  findLatestStockByName,
  formatDefaultExpiryDays,
  getDefaultExpiryCandidates,
  upsertFavoriteItem
} from "../utils/favoriteItemUtils";

type Props = NativeStackScreenProps<RootStackParamList, "StockForm">;

export function StockFormScreen({ route, navigation }: Props) {
  const { stockItems, shoppingItems, setShoppingItems, shoppingTemplates, setShoppingTemplates, addStockItem, updateStockItem, addStockHistoryItem, showToast } = useAppData();
  const editingItem = useMemo(() => stockItems.find((item) => item.id === route.params?.itemId), [stockItems, route.params?.itemId]);
  const handledScannedBarcodeRef = useRef<string | undefined>(undefined);
  const [name, setName] = useState(editingItem?.name ?? route.params?.name ?? "");
  const [barcode, setBarcode] = useState(editingItem?.barcode ?? route.params?.barcode ?? route.params?.scannedBarcode ?? "");
  const [imageUri, setImageUri] = useState(editingItem?.imageUri ?? route.params?.imageUri ?? "");
  const [category, setCategory] = useState(editingItem?.category ?? route.params?.category ?? "野菜");
  const [quantity, setQuantity] = useState(String(editingItem?.quantity ?? route.params?.quantity ?? ""));
  const [unit, setUnit] = useState(editingItem?.unit ?? route.params?.unit ?? getDefaultUnitForCategory(editingItem?.category ?? route.params?.category ?? "野菜"));
  const initialExpiryDate = editingItem?.expiryDate ?? route.params?.expiryDate ?? (route.params?.defaultExpiryDays !== undefined ? calculateExpiryDate(route.params.defaultExpiryDays) : "");
  const [expiryDate, setExpiryDate] = useState(initialExpiryDate);
  const [plannedUseDate, setPlannedUseDate] = useState(editingItem?.plannedUseDate ?? "");
  const [inspectionDate] = useState(editingItem?.inspectionDate ?? "");
  const [location, setLocation] = useState(editingItem?.location ?? route.params?.location ?? "冷蔵庫");
  const [memo, setMemo] = useState(editingItem?.memo ?? "");
  const [shouldRestock, setShouldRestock] = useState(editingItem?.shouldRestock ?? true);
  const [saveAsFavorite, setSaveAsFavorite] = useState(route.params?.saveToFavoriteDefault ?? false);
  const [selectedExpiryDays, setSelectedExpiryDays] = useState<number | undefined>(
    route.params?.defaultExpiryDays ?? calculateDefaultExpiryDays(initialExpiryDate)
  );
  const [openSections, setOpenSections] = useState({
    basic: true,
    dates: true,
    scan: false,
    memo: false
  });

  function toggleSection(section: keyof typeof openSections): void {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function changeCategory(nextCategory: string): void {
    setCategory(nextCategory);
    setSelectedExpiryDays(undefined);
    const nextOptions = getUnitOptionsForCategory(nextCategory);
    if (!nextOptions.includes(unit)) {
      setUnit(getDefaultUnitForCategory(nextCategory));
    }
  }

  function chooseExpiryDays(days: number): void {
    setSelectedExpiryDays(days);
    setExpiryDate(calculateExpiryDate(days));
  }

  function chooseManualExpiry(date: string): void {
    setExpiryDate(date);
    setSelectedExpiryDays(calculateDefaultExpiryDays(date));
  }

  function applyStockItem(item: StockItem): void {
    setName(item.name);
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setCategory(item.category);
    setLocation(item.location);
    if (item.barcode) setBarcode(item.barcode);
    if (item.memo) setMemo(item.memo);
    const days = calculateDefaultExpiryDays(item.expiryDate);
    if (days !== undefined) chooseExpiryDays(days);
    showToast("前回と同じ内容を入力しました");
  }

  function applyFavorite(template: NonNullable<ReturnType<typeof findFavoriteByName>>): void {
    setName(template.name);
    setQuantity(String(template.quantity));
    setUnit(template.unit);
    if (template.category) setCategory(template.category);
    if (template.location) setLocation(template.location);
    if (template.defaultExpiryDays !== undefined) chooseExpiryDays(template.defaultExpiryDays);
    if (template.barcode) setBarcode(template.barcode);
    if (template.memo) setMemo(template.memo);
    showToast("前回と同じ内容を入力しました");
  }

  async function keepImageInAppStorage(uri: string): Promise<string> {
    if (!FileSystem.documentDirectory || uri.startsWith(FileSystem.documentDirectory)) {
      return uri;
    }

    const imageDirectory = `${FileSystem.documentDirectory}stock-images/`;
    await FileSystem.makeDirectoryAsync(imageDirectory, { intermediates: true });
    const extensionMatch = uri.match(/\.(jpg|jpeg|png|webp|heic)(?:\?|$)/i);
    const extension = extensionMatch?.[1] ?? "jpg";
    const destination = `${imageDirectory}stock-${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  }

  useEffect(() => {
    const scannedBarcode = route.params?.scannedBarcode;
    if (!scannedBarcode || handledScannedBarcodeRef.current === scannedBarcode) return;

    handledScannedBarcodeRef.current = scannedBarcode;
    setBarcode(scannedBarcode);
    const template = stockItems.find((item) => item.barcode === scannedBarcode && item.id !== editingItem?.id);
    if (!template) {
      Alert.alert("未登録のバーコード", "同じバーコード番号の商品はまだ登録されていません。商品情報を入力して保存すると、次回から再利用できます。");
      return;
    }

    setName(template.name);
    setCategory(template.category);
    setUnit(template.unit);
    setLocation(template.location);
    setMemo(template.memo ?? "");
    setShouldRestock(template.shouldRestock);
    Alert.alert("商品情報を再利用しました", "登録済みの同じバーコード番号から、品名や種類を入力しました。数量と期限を確認してください。");
  }, [route.params?.scannedBarcode, barcode, stockItems, editingItem?.id]);

  async function pickImage(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!result.canceled) {
      try {
        setImageUri(await keepImageInAppStorage(result.assets[0].uri));
      } catch {
        Alert.alert("写真保存エラー", "選んだ写真をアプリ内に保存できませんでした。");
      }
    }
  }

  async function takePhoto(): Promise<void> {
    const currentPermission = await ImagePicker.getCameraPermissionsAsync();
    if (!currentPermission.granted && currentPermission.canAskAgain) {
      Alert.alert(
        "カメラの使用について",
        "食品の写真を登録するときだけカメラを使います。撮影した写真は、このアプリ内の食品管理に使用します。",
        [
          { text: "あとで", style: "cancel" },
          { text: "許可へ進む", onPress: () => void requestCameraAndLaunch() }
        ]
      );
      return;
    }

    if (!currentPermission.granted) {
      Alert.alert("カメラ許可が必要です", "端末の設定でカメラを許可すると、食品の写真を撮影できます。許可しなくても手入力で登録できます。");
      return;
    }

    await launchCamera();
  }

  async function requestCameraAndLaunch(): Promise<void> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("カメラ許可が必要です", "食品の写真を撮影するにはカメラの許可が必要です。許可しなくても手入力で登録できます。");
      return;
    }
    await launchCamera();
  }

  async function launchCamera(): Promise<void> {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!result.canceled) {
      try {
        setImageUri(await keepImageInAppStorage(result.assets[0].uri));
      } catch {
        Alert.alert("写真保存エラー", "撮影した写真をアプリ内に保存できませんでした。");
      }
    }
  }

  function save(): void {
    const parsedQuantity = Number(quantity);
    if (!editingItem && !canAddStockItem(currentPlan, stockItems.length)) {
      Alert.alert("登録できません", "現在は食品を追加できません。時間をおいてもう一度お試しください。");
      return;
    }
    if (!name.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("入力エラー", "品名と正しい数量を入力してください。");
      return;
    }
    if (!isValidDateInput(expiryDate) || !isValidDateInput(plannedUseDate)) {
      Alert.alert("日付エラー", "日付をもう一度選び直してください。");
      return;
    }

    const now = new Date().toISOString();
    const item: StockItem = {
      id: editingItem?.id ?? `stock-${Date.now()}`,
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      imageUri: imageUri || undefined,
      category,
      quantity: parsedQuantity,
      unit,
      expiryDate: expiryDate.trim() || undefined,
      plannedUseDate: plannedUseDate.trim() || undefined,
      inspectionDate: inspectionDate.trim() || undefined,
      location,
      memo: memo.trim() || undefined,
      shouldRestock,
      createdAt: editingItem?.createdAt ?? now,
      updatedAt: now
    };

    const action = editingItem ? updateStockItem(item) : addStockItem(item);
    action
      .then(async () => {
        if (!editingItem) {
          await addStockHistoryItem({
            id: `history-${Date.now()}`,
            type: "購入",
            stockItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            createdAt: new Date().toISOString()
          });
        }
        if (!editingItem && saveAsFavorite) {
          const favorite = createFavoriteFromStock(item);
          const existing = findFavoriteByName(shoppingTemplates, favorite.name);
          if (existing) {
            Alert.alert(
              "よく買うものに登録済みです",
              `「${favorite.name}」はすでによく買うものに登録されています。内容を更新しますか？`,
              [
                {
                  text: "更新する",
                  onPress: () => void setShoppingTemplates(upsertFavoriteItem(shoppingTemplates, favorite)).then(() => {
                    void markShoppingItemPurchased();
                    showToast("食品を保存し、よく買うものを更新しました");
                    navigation.goBack();
                  })
                },
                {
                  text: "そのまま",
                  onPress: () => {
                    void markShoppingItemPurchased();
                    showToast("食品を保存しました");
                    navigation.goBack();
                  }
                },
                { text: "キャンセル", style: "cancel" }
              ]
            );
            return;
          }
          await setShoppingTemplates(upsertFavoriteItem(shoppingTemplates, favorite));
        }
        await markShoppingItemPurchased();
        showToast(editingItem ? "食品を更新しました" : "食品を保存しました");
        navigation.goBack();
      })
      .catch(() => Alert.alert("保存エラー", "食品を保存できませんでした。"));
  }

  async function markShoppingItemPurchased(): Promise<void> {
    const shoppingId = route.params?.fromShoppingListItemId;
    if (!shoppingId) return;
    await setShoppingItems(shoppingItems.map((item) => item.id === shoppingId ? {
      ...item,
      checked: true,
      status: "purchased",
      updatedAt: new Date().toISOString()
    } : item));
  }

  const unitOptions = getUnitOptionsForCategory(category, unit);
  const expiryCandidates = getDefaultExpiryCandidates(category);
  const favoriteSuggestion = !editingItem ? findFavoriteByName(shoppingTemplates, name) : undefined;
  const stockSuggestion = !favoriteSuggestion && !editingItem ? findLatestStockByName(stockItems, name) : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title={editingItem ? "食品を編集" : "食品を追加"} subtitle="冷蔵庫・冷凍庫・常温の食品を期限つきで管理します" />
      <View style={styles.form}>
        <FormSection title="基本情報" open={openSections.basic} onToggle={() => toggleSection("basic")}>
          <FormInput label="品名" value={name} onChangeText={setName} placeholder="例：牛乳" />
          {favoriteSuggestion ? (
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionTitle}>前回の登録内容があります</Text>
              <Text style={styles.name}>{favoriteSuggestion.name}</Text>
              <Text style={styles.meta}>
                {favoriteSuggestion.quantity}{favoriteSuggestion.unit} / {favoriteSuggestion.category ?? "カテゴリ未設定"} / {favoriteSuggestion.location ?? "保管場所未設定"}
              </Text>
              <Text style={styles.meta}>期限目安：{formatDefaultExpiryDays(favoriteSuggestion.defaultExpiryDays)}</Text>
              <PrimaryButton title="前回と同じ内容を使う" variant="soft" onPress={() => applyFavorite(favoriteSuggestion)} />
            </View>
          ) : null}
          {stockSuggestion ? (
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionTitle}>前回の登録内容があります</Text>
              <Text style={styles.name}>{stockSuggestion.name}</Text>
              <Text style={styles.meta}>
                {stockSuggestion.quantity}{stockSuggestion.unit} / {stockSuggestion.category} / {stockSuggestion.location}
              </Text>
              <Text style={styles.meta}>期限目安：{formatDefaultExpiryDays(calculateDefaultExpiryDays(stockSuggestion.expiryDate))}</Text>
              <PrimaryButton title="前回と同じ内容を使う" variant="soft" onPress={() => applyStockItem(stockSuggestion)} />
            </View>
          ) : null}
          <FormInput label="数量" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="例：6" />
          <Text style={styles.groupLabel}>単位</Text>
          <SelectButtonGroup options={unitOptions} value={unit} onChange={setUnit} />
          <Text style={styles.groupLabel}>カテゴリ</Text>
          <SelectButtonGroup options={categories} value={category} onChange={changeCategory} />
          <Text style={styles.groupLabel}>保管場所</Text>
          <SelectButtonGroup options={locations} value={location} onChange={setLocation} />
        </FormSection>

        <FormSection title="期限" open={openSections.dates} onToggle={() => toggleSection("dates")}>
          <Text style={styles.groupLabel}>賞味期限</Text>
          <View style={styles.expiryGrid}>
            {expiryCandidates.map((candidate) => (
              <Pressable key={candidate.label} style={[styles.expiryButton, candidate.days !== undefined && selectedExpiryDays === candidate.days && styles.expiryButtonSelected]} onPress={() => candidate.days !== undefined ? chooseExpiryDays(candidate.days) : undefined}>
                <Text style={[styles.expiryButtonText, candidate.days !== undefined && selectedExpiryDays === candidate.days && styles.expiryButtonTextSelected]}>
                  {candidate.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.selectedExpiryText}>選択中の賞味期限：{expiryDate || "未選択"}</Text>
          <CalendarDatePicker label="日付を選ぶ" value={expiryDate} onChange={chooseManualExpiry} />
          <PrimaryButton title="期限写真を添付する" variant="soft" onPress={() => navigation.navigate("OcrExpiry")} />
          <CalendarDatePicker label="消費予定日" value={plannedUseDate} onChange={setPlannedUseDate} />
        </FormSection>

        <FormSection title="写真・バーコード" open={openSections.scan} onToggle={() => toggleSection("scan")}>
          <PrimaryButton title="バーコードを読み取る" onPress={() => navigation.navigate("BarcodeScan", { itemId: editingItem?.id })} />
          <FormInput label="バーコード番号" value={barcode} onChangeText={setBarcode} placeholder="例：4900000000000" keyboardType="numeric" />
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}
          <View style={styles.photoActions}>
            <PrimaryButton title="写真を選ぶ" onPress={() => void pickImage()} variant="soft" />
            <PrimaryButton title="写真を撮る" onPress={() => void takePhoto()} variant="soft" />
          </View>
        </FormSection>

        <FormSection title="メモ・買い足し" open={openSections.memo} onToggle={() => toggleSection("memo")}>
          <FormInput label="メモ" value={memo} onChangeText={setMemo} placeholder="置き場所や購入メモ" multiline />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>買い足し対象にする</Text>
              <Text style={styles.switchSub}>食べ切ったあと買い足すものとして表示します</Text>
            </View>
            <Switch value={shouldRestock} onValueChange={setShouldRestock} />
          </View>
        </FormSection>
        {!editingItem ? (
          <Pressable style={styles.favoriteToggle} onPress={() => setSaveAsFavorite((current) => !current)}>
            <Text style={styles.checkBox}>{saveAsFavorite ? "✓" : ""}</Text>
            <Text style={styles.favoriteToggleText}>この食品を「よく買うもの」に保存する</Text>
          </Pressable>
        ) : null}
        <PrimaryButton title="保存する" onPress={save} />
      </View>
    </ScrollView>
  );
}

function expiryLabel(days: number): string {
  if (days === 0) return "今日";
  if (days === 1) return "明日";
  if (days === 180) return "半年後";
  if (days === 365) return "1年後";
  if (days === 730) return "2年後";
  if (days === 1095) return "3年後";
  return `${days}日後`;
}

function FormSection({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionIcon}>{open ? "−" : "＋"}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 30 },
  form: { paddingHorizontal: 20, gap: 14 },
  sectionCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden" },
  sectionHeader: { minHeight: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.textMain, fontSize: 17, fontWeight: "900" },
  sectionIcon: { color: colors.primary, fontSize: 24, fontWeight: "900" },
  sectionBody: { gap: 14, padding: 14, borderTopWidth: 1, borderTopColor: colors.border },
  groupLabel: { color: colors.textMain, fontSize: 15, fontWeight: "800" },
  suggestionCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, gap: 8 },
  name: { color: colors.textMain, fontSize: 17, fontWeight: "900" },
  meta: { color: colors.textSub, fontSize: 13, lineHeight: 19 },
  suggestionTitle: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  expiryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expiryButton: { minWidth: 84, borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.card, alignItems: "center" },
  expiryButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  expiryButtonText: { color: colors.textSub, fontWeight: "800" },
  expiryButtonTextSelected: { color: colors.card },
  selectedExpiryText: { color: colors.textMain, fontSize: 15, fontWeight: "800", backgroundColor: colors.primarySoft, borderRadius: 8, padding: 10 },
  image: { width: "100%", height: 180, borderRadius: 8, backgroundColor: colors.muted },
  photoActions: { gap: 8 },
  favoriteToggle: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.primary, color: colors.primary, textAlign: "center", lineHeight: 20, fontSize: 16, fontWeight: "900" },
  favoriteToggleText: { color: colors.textMain, fontSize: 15, fontWeight: "800", flex: 1 },
  switchRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  switchTitle: { color: colors.textMain, fontSize: 16, fontWeight: "800" },
  switchSub: { color: colors.textSub, fontSize: 13, marginTop: 3 }
});
