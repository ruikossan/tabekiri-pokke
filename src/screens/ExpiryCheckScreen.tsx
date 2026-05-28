import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionTitle } from "../components/SectionTitle";
import { StockItemCard } from "../components/StockItemCard";
import { EmptyState } from "../components/EmptyState";
import { RootStackParamList, ShoppingItem, StockItem } from "../types";
import { useAppData } from "../services/AppDataContext";
import { getDaysUntilExpiry, sortByExpiry } from "../utils/expiryUtils";

type Props = NativeStackScreenProps<RootStackParamList, "ExpiryCheck">;

type ExpiryGroup = {
  title: string;
  filter: (item: StockItem) => boolean;
};

const groups: ExpiryGroup[] = [
  { title: "期限切れ", filter: (item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days < 0;
  } },
  { title: "7日以内", filter: (item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days >= 0 && days <= 7;
  } },
  { title: "30日以内", filter: (item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days > 7 && days <= 30;
  } },
  { title: "90日以内", filter: (item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days > 30 && days <= 90;
  } }
];

function formatRemainingDays(item: StockItem): string {
  const days = getDaysUntilExpiry(item.expiryDate);
  if (days === undefined) return "期限なし";
  if (days < 0) return "期限切れ";
  if (days === 0) return "今日まで";
  return `あと${days}日`;
}

export function ExpiryCheckScreen({ navigation }: Props) {
  const { stockItems, consumeStockItem, addShoppingItem, showToast } = useAppData();
  const groupedItems = useMemo(
    () => groups.map((group) => ({
      ...group,
      items: sortByExpiry(stockItems.filter(group.filter))
    })),
    [stockItems]
  );

  function addToShopping(item: StockItem): void {
    const shoppingItem: ShoppingItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      reason: "買い足し予定",
      checked: false,
      source: "nearExpiry",
      status: "pending",
      createdAt: new Date().toISOString()
    };
    addShoppingItem(shoppingItem)
      .then(() => showToast("次回買うものに追加しました"))
      .catch(() => Alert.alert("追加エラー", "次回買うものに追加できませんでした。"));
  }

  function consume(item: StockItem): void {
    Alert.alert(`${item.name}を消費済みにしますか？`, "食品ストックから削除し、履歴に記録します。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "消費済み",
        onPress: () => void consumeStockItem(item.id)
          .then(() => showToast("消費済みにしました"))
          .catch(() => Alert.alert("更新エラー", "消費済みにできませんでした。"))
      }
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="期限チェック" subtitle="期限切れや期限が近い食品を確認できます。" />
      <View style={styles.wrap}>
        {stockItems.length === 0 ? (
          <EmptyState title="食品がありません" message="食品を追加すると期限チェックできます。" />
        ) : groupedItems.map((group) => (
          <View key={group.title} style={styles.group}>
            <SectionTitle title={`${group.title}（${group.items.length}件）`} />
            {group.items.length === 0 ? (
              <Text style={styles.emptyLine}>対象はありません</Text>
            ) : group.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <StockItemCard item={item} onPress={() => navigation.navigate("StockForm", { itemId: item.id })} />
                <Text style={styles.remaining}>{formatRemainingDays(item)}</Text>
                <View style={styles.actions}>
                  <PrimaryButton title="消費済み" onPress={() => consume(item)} />
                  <View style={styles.subActions}>
                    <CompactAction title="次回も買う" onPress={() => addToShopping(item)} />
                    <CompactAction title="編集" onPress={() => navigation.navigate("StockForm", { itemId: item.id })} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CompactAction({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.compactButton} onPress={onPress}>
      <Text style={styles.compactButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 10 },
  group: { gap: 8 },
  item: { gap: 8, marginBottom: 12 },
  emptyLine: { color: colors.textSub, fontSize: 14, fontWeight: "700", paddingHorizontal: 2, paddingBottom: 8 },
  remaining: { color: colors.warning, fontSize: 13, fontWeight: "900", paddingHorizontal: 4 },
  actions: { gap: 8 },
  subActions: { flexDirection: "row", gap: 8 },
  compactButton: { flex: 1, minHeight: 38, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  compactButtonText: { color: colors.primary, fontSize: 13, fontWeight: "900" }
});
