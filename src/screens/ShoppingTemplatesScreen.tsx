import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { categories } from "../constants/categories";
import { locations } from "../constants/locations";
import { EmptyState } from "../components/EmptyState";
import { FormInput } from "../components/FormInput";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionTitle } from "../components/SectionTitle";
import { SelectButtonGroup } from "../components/SelectButtonGroup";
import { ShoppingTemplate } from "../types";
import { useAppData } from "../services/AppDataContext";
import { addStockFromFavorite, formatDefaultExpiryDays, upsertFavoriteItem } from "../utils/favoriteItemUtils";

const defaultExpiryOptions = [
  { label: "購入日＋7日", days: 7 },
  { label: "購入日＋30日", days: 30 },
  { label: "購入日＋90日", days: 90 },
  { label: "購入日＋半年", days: 180 },
  { label: "購入日＋1年", days: 365 },
  { label: "購入日＋2年", days: 730 }
];

export function ShoppingTemplatesScreen() {
  const { shoppingTemplates, setShoppingTemplates, addStockItem, addStockHistoryItem, showToast } = useAppData();
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("個");
  const [category, setCategory] = useState("その他");
  const [location, setLocation] = useState("冷蔵庫");
  const [defaultExpiryDays, setDefaultExpiryDays] = useState(7);
  const [barcode, setBarcode] = useState("");
  const [memo, setMemo] = useState("");

  function addTemplate(): void {
    const parsedQuantity = Number(quantity);
    if (!name.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("入力エラー", "品名と正しい数量を入力してください。");
      return;
    }

    const now = new Date().toISOString();
    const template: ShoppingTemplate = {
      id: editingId ?? `template-${Date.now()}`,
      name: name.trim(),
      quantity: parsedQuantity,
      unit,
      category,
      location,
      defaultExpiryDays,
      barcode: barcode.trim() || undefined,
      memo: memo.trim() || undefined,
      createdAt: shoppingTemplates.find((item) => item.id === editingId)?.createdAt ?? now,
      updatedAt: now
    };
    const nextItems = editingId
      ? shoppingTemplates.map((item) => item.id === editingId ? template : item)
      : upsertFavoriteItem(shoppingTemplates, template);
    void setShoppingTemplates(nextItems).then(() => showToast(editingId ? "よく買うものを更新しました" : "よく買うものに追加しました"));
    resetForm();
  }

  function resetForm(): void {
    setEditingId(undefined);
    setName("");
    setQuantity("");
    setUnit("個");
    setCategory("その他");
    setLocation("冷蔵庫");
    setDefaultExpiryDays(7);
    setBarcode("");
    setMemo("");
  }

  function startEdit(template: ShoppingTemplate): void {
    setEditingId(template.id);
    setName(template.name);
    setQuantity(String(template.quantity));
    setUnit(template.unit);
    setCategory(template.category ?? "その他");
    setLocation(template.location ?? "冷蔵庫");
    setDefaultExpiryDays(template.defaultExpiryDays ?? 7);
    setBarcode(template.barcode ?? "");
    setMemo(template.memo ?? "");
  }

  function addToStock(template: ShoppingTemplate): void {
    const item = addStockFromFavorite(template);
    Alert.alert(`${template.name}を食品ストックに追加しますか？`, `内容：\n${item.quantity}${item.unit}\n${item.category} / ${item.location}\n賞味期限：${item.expiryDate ?? "未設定"}`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "追加する",
        onPress: () => void addStockItem(item)
          .then(async () => {
            await addStockHistoryItem({
              id: `history-${Date.now()}`,
              type: "購入",
              stockItemId: item.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              createdAt: new Date().toISOString()
            });
            showToast(`${template.name}を食品ストックに追加しました`);
          })
          .catch(() => Alert.alert("追加エラー", "食品ストックに追加できませんでした。"))
      }
    ]);
    return;
    addStockItem(item)
      .then(async () => {
        await addStockHistoryItem({
          id: `history-${Date.now()}`,
          type: "購入",
          stockItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          createdAt: new Date().toISOString()
        });
        showToast(`${template.name}を食品ストックに追加しました`);
      })
      .catch(() => Alert.alert("追加エラー", "食品ストックに追加できませんでした。"));
  }

  function removeTemplate(id: string): void {
    Alert.alert("削除確認", "このよく買うものを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => void setShoppingTemplates(shoppingTemplates.filter((item) => item.id !== id)).then(() => showToast("よく買うものを削除しました")) }
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="よく買うもの" subtitle="よく買う食品をすぐ買い物リストへ追加します" />
      <View style={styles.wrap}>
        <View style={styles.addCard}>
          <FormInput label="品名" value={name} onChangeText={setName} placeholder="例：水 2L" />
          <View style={styles.amountRow}>
            <View style={styles.quantityField}>
              <FormInput label="数量" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="例：6" />
            </View>
            <View style={styles.unitField}>
              <FormInput label="単位" value={unit} onChangeText={setUnit} placeholder="例：本" />
            </View>
          </View>
          <Text style={styles.groupLabel}>カテゴリ</Text>
          <SelectButtonGroup options={categories} value={category} onChange={setCategory} />
          <Text style={styles.groupLabel}>保管場所</Text>
          <SelectButtonGroup options={locations} value={location} onChange={setLocation} />
          <Text style={styles.groupLabel}>賞味期限目安</Text>
          <View style={styles.expiryOptions}>
            {defaultExpiryOptions.map((option) => (
              <Pressable key={option.days} style={[styles.expiryButton, defaultExpiryDays === option.days && styles.expiryButtonSelected]} onPress={() => setDefaultExpiryDays(option.days)}>
                <Text style={[styles.expiryButtonText, defaultExpiryDays === option.days && styles.expiryButtonTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <FormInput label="バーコード" value={barcode} onChangeText={setBarcode} placeholder="例：4900000000000" keyboardType="numeric" />
          <FormInput label="メモ" value={memo} onChangeText={setMemo} placeholder="購入メモなど" multiline />
          <PrimaryButton title={editingId ? "よく買うものを更新" : "よく買うものに追加"} onPress={addTemplate} />
          {editingId ? <PrimaryButton title="編集をやめる" variant="soft" onPress={resetForm} /> : null}
        </View>
        <View style={styles.listHeader}>
          <SectionTitle title="登録済みのよく買うもの" />
          <Text style={styles.count}>{shoppingTemplates.length}件</Text>
        </View>
        {shoppingTemplates.length === 0 ? (
          <EmptyState title="まだ登録がありません" message="よく買う食品を登録すると、ここから1タップで買い物リストへ追加できます。" />
        ) : shoppingTemplates.map((template) => (
          <View key={template.id} style={styles.card}>
            <View style={styles.cardMain}>
              <View style={styles.info}>
                <Text style={styles.name}>{template.name}</Text>
                <Text style={styles.meta}>{template.quantity}{template.unit}</Text>
                <Text style={styles.meta}>{template.category ?? "カテゴリ未設定"} / {template.location ?? "保管場所未設定"}</Text>
                <Text style={styles.expiryMeta}>期限目安：{formatDefaultExpiryDays(template.defaultExpiryDays)}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <Pressable onPress={() => addToStock(template)} style={styles.addBadge}>
                <Text style={styles.addBadgeText}>追加</Text>
              </Pressable>
              <Pressable onPress={() => startEdit(template)} style={styles.editButton}>
                <Text style={styles.editText}>編集</Text>
              </Pressable>
              <Pressable onPress={() => removeTemplate(template.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>削除</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 12 },
  addCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 12 },
  amountRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  quantityField: { width: 116 },
  unitField: { width: 96 },
  groupLabel: { color: colors.textMain, fontSize: 15, fontWeight: "800" },
  expiryOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expiryButton: { borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card },
  expiryButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  expiryButtonText: { color: colors.textSub, fontWeight: "800" },
  expiryButtonTextSelected: { color: colors.card },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  count: { color: colors.textSub, fontSize: 13, fontWeight: "800" },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, gap: 8 },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1 },
  name: { color: colors.textMain, fontSize: 17, fontWeight: "800" },
  meta: { color: colors.textSub, fontSize: 14, marginTop: 3 },
  expiryMeta: { color: colors.warning, fontSize: 14, marginTop: 3, fontWeight: "800" },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8, flexWrap: "wrap" },
  addBadge: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  addBadgeText: { color: colors.primary, fontSize: 13, fontWeight: "900" },
  editButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  editText: { color: colors.textMain, fontWeight: "800" },
  deleteButton: { paddingHorizontal: 8, paddingVertical: 5 },
  deleteText: { color: colors.danger, fontWeight: "800" }
});
