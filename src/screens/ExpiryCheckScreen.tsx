import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionTitle } from "../components/SectionTitle";
import { StockItemCard } from "../components/StockItemCard";
import { EmptyState } from "../components/EmptyState";
import { RootStackParamList, ShoppingItem, StockItem } from "../types";
import { useAppData } from "../services/AppDataContext";
import { getDaysUntilExpiry, getExpiryStatus, sortByExpiry } from "../utils/expiryUtils";
import { ConsumptionPlan, generateConsumptionPlans } from "../utils/consumptionPlanner";

type Props = NativeStackScreenProps<RootStackParamList, "ExpiryCheck">;
const groups = ["期限切れ", "7日以内", "30日以内", "90日以内"] as const;

function getPriorityLabel(priority: ConsumptionPlan["priority"]): string {
  switch (priority) {
    case "today":
      return "早めに消費";
    case "week":
      return "今週の候補";
    default:
      return "今月の候補";
  }
}

function formatRemainingDays(item: StockItem): string {
  const days = getDaysUntilExpiry(item.expiryDate);
  if (days === undefined) return "期限なし";
  if (days < 0) return "期限切れ";
  if (days === 0) return "今日まで";
  return `あと${days}日`;
}

export function ExpiryCheckScreen({ navigation }: Props) {
  const { stockItems, consumeStockItem, addShoppingItem, showToast } = useAppData();
  const consumptionPlans = useMemo(() => generateConsumptionPlans(stockItems), [stockItems]);

  function createShoppingItem(name: string, reason: ShoppingItem["reason"], quantity?: number, unit?: string): ShoppingItem {
    return {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      quantity,
      unit,
      reason,
      checked: false,
      createdAt: new Date().toISOString()
    };
  }

  function addToShopping(item: StockItem): void {
    const shoppingItem: ShoppingItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      reason: "期限間近",
      checked: false,
      createdAt: new Date().toISOString()
    };
    addShoppingItem(shoppingItem)
      .then(() => showToast("買い物リストに追加しました"))
      .catch(() => Alert.alert("追加エラー", "買い物リストに追加できませんでした。"));
  }

  function addPlanRestock(plan: ConsumptionPlan): void {
    const items = plan.restockItems.length > 0 ? plan.restockItems : plan.stockItems;
    Promise.all(items.map((item) => addShoppingItem(createShoppingItem(item.name, "期限間近", item.quantity, item.unit))))
      .then(() => showToast("補充候補を買い物リストに追加しました"))
      .catch(() => Alert.alert("追加エラー", "補充候補を追加できませんでした。"));
  }

  function addMissingItems(plan: ConsumptionPlan): void {
    Promise.all(plan.missingItems.map((name) => addShoppingItem(createShoppingItem(name, "手動追加"))))
      .then(() => showToast("足りないものを買い物リストに追加しました"))
      .catch(() => Alert.alert("追加エラー", "足りないものを追加できませんでした。"));
  }

  function consumePlan(plan: ConsumptionPlan): void {
    Alert.alert("消費済みにする", `${plan.stockItems.length}件の食品を消費済みにしますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "消費済み",
        onPress: () => {
          Promise.all(plan.stockItems.map((item) => consumeStockItem(item.id)))
            .then(() => showToast("消費済みにしました"))
            .catch(() => Alert.alert("更新エラー", "消費済みにできませんでした。"));
        }
      }
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="期限チェック" subtitle="期限が近いものを、日常の食事で無理なく消費します" />
      <View style={styles.wrap}>
        <SectionTitle title="今週の消費プラン" />
        {consumptionPlans.length === 0 ? (
          <View style={styles.emptyPlan}>
            <Text style={styles.emptyPlanTitle}>消費プランはありません</Text>
            <Text style={styles.emptyPlanText}>90日以内に期限が来る食品があると、組み合わせ候補を表示します。</Text>
          </View>
        ) : consumptionPlans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleBox}>
                <Text style={styles.planPriority}>{getPriorityLabel(plan.priority)}</Text>
                <Text style={styles.planTitle}>{plan.title}</Text>
              </View>
              <Text style={styles.planCount}>{plan.stockItems.length}品</Text>
            </View>
            <Text style={styles.planDescription}>{plan.description}</Text>
            <View style={styles.planItems}>
              {plan.stockItems.map((item) => (
                <View key={item.id} style={styles.planItemChip}>
                  <Text style={styles.planItemName}>{item.name}</Text>
                  <Text style={styles.planItemMeta}>{formatRemainingDays(item)}</Text>
                </View>
              ))}
            </View>
            {plan.missingItems.length > 0 ? (
              <Text style={styles.missingText}>足すと使いやすいもの: {plan.missingItems.join("、")}</Text>
            ) : null}
            <View style={styles.planActions}>
              <PrimaryButton title="消費済み" onPress={() => consumePlan(plan)} />
              <PrimaryButton title="補充を追加" variant="soft" onPress={() => addPlanRestock(plan)} />
              <PrimaryButton title="足りないもの追加" variant="soft" onPress={() => addMissingItems(plan)} />
            </View>
          </View>
        ))}

        {groups.map((group) => {
          const items = sortByExpiry(stockItems.filter((item) => getExpiryStatus(item.expiryDate) === group));
          return (
            <View key={group}>
              <SectionTitle title={`${group}（${items.length}件）`} />
              {items.length === 0 ? <Text style={styles.emptyLine}>対象はありません</Text> : items.map((item) => (
                <View key={item.id} style={styles.item}>
                  <StockItemCard item={item} onPress={() => navigation.navigate("StockForm", { itemId: item.id })} />
                  <View style={styles.actions}>
                    <PrimaryButton title="消費済み" onPress={() => void consumeStockItem(item.id).then(() => showToast("消費済みにしました"))} />
                    <PrimaryButton title="買い物リスト追加" onPress={() => addToShopping(item)} />
                    <PrimaryButton title="編集" onPress={() => navigation.navigate("StockForm", { itemId: item.id })} />
                  </View>
                </View>
              ))}
            </View>
          );
        })}
        {stockItems.length === 0 ? <EmptyState title="食品がありません" message="食品を追加すると期限チェックできます。" /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 8 },
  emptyPlan: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, gap: 4 },
  emptyPlanTitle: { color: colors.textMain, fontSize: 16, fontWeight: "900" },
  emptyPlanText: { color: colors.textSub, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  planCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 15,
    gap: 11,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  planHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  planTitleBox: { flex: 1 },
  planPriority: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  planTitle: { color: colors.textMain, fontSize: 18, fontWeight: "900", marginTop: 3 },
  planCount: { color: colors.textSub, backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: "900" },
  planDescription: { color: colors.textSub, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  planItems: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  planItemChip: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  planItemName: { color: colors.textMain, fontSize: 13, fontWeight: "900" },
  planItemMeta: { color: colors.yellow, fontSize: 11, fontWeight: "900" },
  missingText: { color: colors.textMain, backgroundColor: colors.secondarySoft, borderRadius: 8, padding: 10, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  planActions: { gap: 8 },
  item: { gap: 8, marginBottom: 12 },
  actions: { gap: 8 },
  emptyLine: { color: colors.textSub, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12 }
});
