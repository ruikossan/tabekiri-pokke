import React, { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Header } from "../components/Header";
import { EmptyState } from "../components/EmptyState";
import { colors } from "../constants/colors";
import { recipeImages } from "../constants/recipeImages";
import { useAppData } from "../services/AppDataContext";
import { RootStackParamList, StockItem } from "../types";
import { generateConsumptionPlans } from "../utils/consumptionPlanner";
import { getDaysUntilExpiry } from "../utils/expiryUtils";

type Props = NativeStackScreenProps<RootStackParamList, "RecipeDetail">;

function formatRemainingDays(item: StockItem): string {
  const days = getDaysUntilExpiry(item.expiryDate);
  if (days === undefined) return "期限なし";
  if (days < 0) return "期限切れ";
  if (days === 0) return "今日まで";
  return `あと${days}日`;
}

export function RecipeDetailScreen({ route }: Props) {
  const { stockItems } = useAppData();
  const plans = useMemo(() => generateConsumptionPlans(stockItems), [stockItems]);
  const plan = plans.find((candidate) => candidate.id === route.params.planId);

  if (!plan) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <EmptyState title="作り方が見つかりません" message="食品の期限や登録内容が変わった可能性があります。期限チェック画面からもう一度開いてください。" />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title={plan.title} subtitle="かんたんな作り方を、順番に確認できます" />
      <View style={styles.wrap}>
        <View style={styles.imageBox}>
          <Image source={recipeImages[plan.imageKey]} style={styles.recipeImage} resizeMode="cover" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>この料理で使うもの</Text>
          <View style={styles.chipWrap}>
            {plan.stockItems.map((item) => (
              <View key={item.id} style={styles.itemChip}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{formatRemainingDays(item)}</Text>
              </View>
            ))}
          </View>
          {plan.missingItems.length > 0 ? (
            <Text style={styles.helperText}>家にあれば足すと作りやすいもの: {plan.missingItems.join("、")}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>作る前に</Text>
          <Text style={styles.bodyText}>先に使う食品を全部出して、期限が近いものから使います。火や包丁を使うときは、大人と一緒に作ってください。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>作り方</Text>
          {plan.recipeSteps.map((step, index) => (
            <View key={`${plan.id}-detail-step-${index}`} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>食べきりのコツ</Text>
          <Text style={styles.bodyText}>一度に全部使わなくても大丈夫です。今日使う分だけ取り出し、残りは「次に使う日」を決めておくと忘れにくくなります。</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 14 },
  section: { gap: 10 },
  imageBox: { width: "100%", height: 220, borderRadius: 8, overflow: "hidden", backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border },
  recipeImage: { width: "100%", height: "100%" },
  sectionTitle: { color: colors.textMain, fontSize: 18, fontWeight: "900" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  itemChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9, gap: 2 },
  itemName: { color: colors.textMain, fontSize: 14, fontWeight: "900" },
  itemMeta: { color: colors.yellow, fontSize: 12, fontWeight: "900" },
  helperText: { color: colors.textMain, backgroundColor: colors.secondarySoft, borderRadius: 8, padding: 12, fontSize: 14, lineHeight: 21, fontWeight: "800" },
  bodyText: { color: colors.textSub, fontSize: 15, lineHeight: 24, fontWeight: "700" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, color: colors.card, textAlign: "center", lineHeight: 28, fontSize: 14, fontWeight: "900", overflow: "hidden" },
  stepText: { flex: 1, color: colors.textMain, fontSize: 15, lineHeight: 24, fontWeight: "800" },
  tipBox: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 7 },
  tipTitle: { color: colors.textMain, fontSize: 16, fontWeight: "900" }
});
