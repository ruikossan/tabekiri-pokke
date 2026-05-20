import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { EmptyState } from "../components/EmptyState";
import { FormInput } from "../components/FormInput";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectButtonGroup } from "../components/SelectButtonGroup";
import { ShoppingItem, ShoppingReason } from "../types";
import { useAppData } from "../services/AppDataContext";
import { generateAutoShoppingItems } from "../utils/shoppingListUtils";

const reasonOptions = ["すべて", "不足", "期限間近", "手動追加"];

export function ShoppingListScreen() {
  const { stockItems, settings, shoppingItems, addShoppingItem, setShoppingItems, addStockHistoryItem, showToast } = useAppData();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("個");
  const [reasonFilter, setReasonFilter] = useState("すべて");

  const list = useMemo(() => {
    const items = generateAutoShoppingItems(stockItems, settings, shoppingItems);
    return reasonFilter === "すべて" ? items : items.filter((item) => item.reason === reasonFilter);
  }, [stockItems, settings, shoppingItems, reasonFilter]);

  function addManual(): void {
    if (!name.trim()) {
      Alert.alert("入力エラー", "商品名を入力してください。");
      return;
    }
    const item: ShoppingItem = {
      id: `manual-${Date.now()}`,
      name: name.trim(),
      quantity: quantity ? Number(quantity) : undefined,
      unit,
      reason: "手動追加",
      checked: false,
      createdAt: new Date().toISOString()
    };
    addShoppingItem(item)
      .then(() => showToast("買い物リストに追加しました"))
      .catch(() => Alert.alert("追加エラー", "買い物リストに追加できませんでした。"));
    setName("");
    setQuantity("");
  }

  function toggle(item: ShoppingItem): void {
    const existing = shoppingItems.find((current) => current.id === item.id);
    const nextChecked = !(existing?.checked ?? item.checked);

    if (nextChecked) {
      void addStockHistoryItem({
        id: `history-${Date.now()}`,
        type: "購入",
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        createdAt: new Date().toISOString()
      });
      showToast("購入済みにしました");
    } else {
      showToast("未購入に戻しました");
    }

    if (existing) {
      void setShoppingItems(shoppingItems.map((current) => current.id === item.id ? { ...current, checked: nextChecked } : current));
    } else {
      void addShoppingItem({ ...item, checked: nextChecked });
    }
  }

  function remove(item: ShoppingItem): void {
    if (!shoppingItems.some((current) => current.id === item.id)) {
      Alert.alert("自動項目", "不足や期限間近の自動項目は、食品や設定を更新すると消えます。");
      return;
    }
      void setShoppingItems(shoppingItems.filter((current) => current.id !== item.id)).then(() => showToast("買い物リストから削除しました"));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="買い物リスト" subtitle="不足・期限間近・手動追加をまとめて確認します" />
      <View style={styles.wrap}>
        <View style={styles.addCard}>
          <FormInput label="商品名" value={name} onChangeText={setName} placeholder="例：水 2L" />
          <FormInput label="数量" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="例：6" />
          <FormInput label="単位" value={unit} onChangeText={setUnit} placeholder="例：本" />
          <PrimaryButton title="手動で追加" onPress={addManual} />
        </View>
        <SelectButtonGroup options={reasonOptions} value={reasonFilter} onChange={setReasonFilter} />
        {list.length === 0 ? <EmptyState title="買い物リストは空です" message="期限間近の食品や買い足し候補があると自動表示されます。" /> : list.map((item) => (
          <View key={`${item.id}-${item.reason}`} style={[styles.item, item.checked && styles.checked]}>
            <Pressable style={styles.itemMain} onPress={() => toggle(item)}>
              <Text style={styles.check}>{item.checked ? "✓" : "□"}</Text>
              <View style={styles.info}>
                <Text style={[styles.name, item.checked && styles.checkedText]}>{item.name}</Text>
                <Text style={styles.meta}>{item.quantity ? `${item.quantity}${item.unit ?? ""}` : "数量未設定"}</Text>
              </View>
              <Text style={[styles.badge, badgeStyle(item.reason)]}>{item.reason}</Text>
            </Pressable>
            <Pressable onPress={() => remove(item)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>削除</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function badgeStyle(reason: ShoppingReason) {
  if (reason === "不足") return { color: colors.danger, borderColor: colors.danger };
  if (reason === "期限間近") return { color: colors.yellow, borderColor: colors.yellow };
  return { color: colors.primary, borderColor: colors.primary };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 12 },
  addCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 12 },
  item: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, gap: 8 },
  checked: { opacity: 0.55 },
  itemMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  check: { color: colors.primary, fontSize: 22, fontWeight: "900", width: 28 },
  info: { flex: 1 },
  name: { color: colors.textMain, fontSize: 17, fontWeight: "800" },
  checkedText: { textDecorationLine: "line-through", color: colors.textSub },
  meta: { color: colors.textSub, marginTop: 3 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontWeight: "800" },
  deleteButton: { alignSelf: "flex-end", paddingHorizontal: 8, paddingVertical: 5 },
  deleteText: { color: colors.danger, fontWeight: "800" }
});
