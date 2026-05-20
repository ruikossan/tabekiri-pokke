import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { addDays, formatISO } from "date-fns";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { categories } from "../constants/categories";
import { colors } from "../constants/colors";
import { locations } from "../constants/locations";
import { getDefaultUnitForCategory, getUnitOptionsForCategory } from "../constants/units";
import { FormInput } from "../components/FormInput";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionTitle } from "../components/SectionTitle";
import { SelectButtonGroup } from "../components/SelectButtonGroup";
import { RootStackParamList, StockItem } from "../types";
import { useAppData } from "../services/AppDataContext";
import { formatDateInput, isValidDateInput } from "../utils/dateInputUtils";
import { canAddStockItem, currentPlan } from "../utils/featureGate";

type Props = NativeStackScreenProps<RootStackParamList, "StockForm">;

export function StockFormScreen({ route, navigation }: Props) {
  const { stockItems, settings, addStockItem, updateStockItem, addStockHistoryItem, showToast } = useAppData();
  const editingItem = useMemo(() => stockItems.find((item) => item.id === route.params?.itemId), [stockItems, route.params?.itemId]);
  const handledScannedBarcodeRef = useRef<string | undefined>(undefined);
  const [name, setName] = useState(editingItem?.name ?? "");
  const [barcode, setBarcode] = useState(editingItem?.barcode ?? "");
  const [imageUri, setImageUri] = useState(editingItem?.imageUri ?? "");
  const [category, setCategory] = useState(editingItem?.category ?? "野菜");
  const [quantity, setQuantity] = useState(String(editingItem?.quantity ?? ""));
  const [unit, setUnit] = useState(editingItem?.unit ?? getDefaultUnitForCategory(editingItem?.category ?? "野菜"));
  const [expiryDate, setExpiryDate] = useState(editingItem?.expiryDate ?? "");
  const [plannedUseDate, setPlannedUseDate] = useState(editingItem?.plannedUseDate ?? "");
  const [inspectionDate, setInspectionDate] = useState(editingItem?.inspectionDate ?? formatISO(addDays(new Date(), settings.inspectionIntervalDays), { representation: "date" }));
  const [location, setLocation] = useState(editingItem?.location ?? "冷蔵庫");
  const [memo, setMemo] = useState(editingItem?.memo ?? "");
  const [shouldRestock, setShouldRestock] = useState(editingItem?.shouldRestock ?? true);
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
    const nextOptions = getUnitOptionsForCategory(nextCategory);
    if (nextCategory === "防災用品" && name.includes("トイレ")) {
      setUnit("回分");
      return;
    }
    if (!nextOptions.includes(unit)) {
      setUnit(getDefaultUnitForCategory(nextCategory));
    }
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
    if (!isValidDateInput(expiryDate) || !isValidDateInput(plannedUseDate) || !isValidDateInput(inspectionDate)) {
      Alert.alert("日付エラー", "日付は 2026-05-20 のように8桁の数字で入力してください。");
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
        showToast(editingItem ? "食品を更新しました" : "食品を保存しました");
        navigation.goBack();
      })
      .catch(() => Alert.alert("保存エラー", "食品を保存できませんでした。"));
  }

  function markInspected(): void {
    const nextDate = formatISO(addDays(new Date(), settings.inspectionIntervalDays), { representation: "date" });
    setInspectionDate(nextDate);
    addStockHistoryItem({
      id: `history-${Date.now()}`,
      type: "点検",
      stockItemId: editingItem?.id,
      name: name || "食品",
      memo: `次回点検日: ${nextDate}`,
      createdAt: new Date().toISOString()
    })
      .then(() => showToast("点検完了を記録しました"))
      .catch(() => Alert.alert("履歴エラー", "点検履歴を保存できませんでした。"));
  }

  const todayHint = formatISO(new Date(), { representation: "date" });
  const unitOptions = getUnitOptionsForCategory(category, unit);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title={editingItem ? "食品を編集" : "食品を追加"} subtitle="冷蔵庫・冷凍庫・常温の食品を期限つきで管理します" />
      <View style={styles.form}>
        <FormSection title="基本情報" open={openSections.basic} onToggle={() => toggleSection("basic")}>
          <FormInput label="品名" value={name} onChangeText={setName} placeholder="例：牛乳" />
          <FormInput label="数量" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="例：6" />
          <Text style={styles.groupLabel}>単位</Text>
          <SelectButtonGroup options={unitOptions} value={unit} onChange={setUnit} />
          <Text style={styles.groupLabel}>カテゴリ</Text>
          <SelectButtonGroup options={categories} value={category} onChange={changeCategory} />
          <Text style={styles.groupLabel}>保管場所</Text>
          <SelectButtonGroup options={locations} value={location} onChange={setLocation} />
        </FormSection>

        <FormSection title="期限・点検" open={openSections.dates} onToggle={() => toggleSection("dates")}>
          <FormInput label="賞味期限" value={expiryDate} onChangeText={(value) => setExpiryDate(formatDateInput(value))} keyboardType="number-pad" maxLength={10} placeholder={`例：${todayHint}`} />
          <FormInput label="消費予定日" value={plannedUseDate} onChangeText={(value) => setPlannedUseDate(formatDateInput(value))} keyboardType="number-pad" maxLength={10} placeholder={`例：${todayHint}`} />
          <FormInput label="次回点検日" value={inspectionDate} onChangeText={(value) => setInspectionDate(formatDateInput(value))} keyboardType="number-pad" maxLength={10} placeholder={`例：${todayHint}`} />
          <PrimaryButton title="点検完了にする" onPress={markInspected} variant="soft" />
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
              <Text style={styles.switchSub}>期限間近のとき買い物リストへ出します</Text>
            </View>
            <Switch value={shouldRestock} onValueChange={setShouldRestock} />
          </View>
        </FormSection>
        <PrimaryButton title="保存する" onPress={save} />
      </View>
    </ScrollView>
  );
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
  image: { width: "100%", height: 180, borderRadius: 8, backgroundColor: colors.muted },
  photoActions: { gap: 8 },
  switchRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  switchTitle: { color: colors.textMain, fontSize: 16, fontWeight: "800" },
  switchSub: { color: colors.textSub, fontSize: 13, marginTop: 3 }
});
