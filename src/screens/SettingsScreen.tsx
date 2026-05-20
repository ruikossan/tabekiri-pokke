import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { DangerButton } from "../components/DangerButton";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionTitle } from "../components/SectionTitle";
import { useAppData } from "../services/AppDataContext";
import { notificationService } from "../services/notificationService";
import { canUseFeature, currentPlan, FREE_RECEIPT_IMPORT_ITEM_LIMIT, FREE_RECEIPT_SCAN_MONTHLY_LIMIT, FREE_STOCK_ITEM_LIMIT } from "../utils/featureGate";

const notifyOptions = [7, 30, 90];

export function SettingsScreen() {
  const { settings, updateSettings, seedSampleData, resetAll, showToast, openFirstGuide } = useAppData();

  function changeNumber(key: "familySize" | "stockDays", delta: number): void {
    void updateSettings({ ...settings, [key]: Math.max(1, settings[key] + delta) }).then(() => showToast("設定を更新しました"));
  }

  function changeInspectionInterval(delta: number): void {
    void updateSettings({ ...settings, inspectionIntervalDays: Math.max(30, settings.inspectionIntervalDays + delta) }).then(() => showToast("点検間隔を更新しました"));
  }

  function toggleNotify(day: number): void {
    const exists = settings.notifyDays.includes(day);
    const notifyDays = exists ? settings.notifyDays.filter((value) => value !== day) : [...settings.notifyDays, day].sort((a, b) => a - b);
    void updateSettings({ ...settings, notifyDays }).then(() => showToast("通知する日を更新しました"));
  }

  function confirmReset(): void {
    Alert.alert("最初の状態に戻す", "保存した食品、買い物リスト、設定を消します。元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      { text: "戻す", style: "destructive", onPress: () => void resetAll().then(() => showToast("最初の状態に戻しました")) }
    ]);
  }

  function confirmSample(): void {
    Alert.alert("お試し内容を入れる", "今の内容を、お試し用の内容で上書きします。よろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "入れる", onPress: () => void seedSampleData().then(() => showToast("お試し内容を入れました")) }
    ]);
  }

  function sendTestNotification(): void {
    notificationService.scheduleTestNotification()
      .then((sent) => {
        Alert.alert(sent ? "通知を予約しました" : "通知が許可されていません", sent ? "約3秒後にテスト通知が表示されます。" : "端末の通知設定を確認してください。");
      })
      .catch(() => Alert.alert("通知エラー", "テスト通知を予約できませんでした。"));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="設定" subtitle="登録数、通知、プランを確認します" />
      <View style={styles.wrap}>
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>使い方に迷ったら</Text>
          <Text style={styles.guideText}>初回に表示されたたべきりポッケの使い方を、いつでも見直せます。</Text>
          <PrimaryButton title="使い方ガイドを表示" onPress={openFirstGuide} />
        </View>
        <SectionTitle title="基本設定" />
        <Stepper label="家族人数" value={settings.familySize} unit="人" onMinus={() => changeNumber("familySize", -1)} onPlus={() => changeNumber("familySize", 1)} />
        <Stepper label="備蓄日数" value={settings.stockDays} unit="日" onMinus={() => changeNumber("stockDays", -1)} onPlus={() => changeNumber("stockDays", 1)} />
        <Stepper label="点検間隔" value={settings.inspectionIntervalDays} unit="日" onMinus={() => changeInspectionInterval(-30)} onPlus={() => changeInspectionInterval(30)} />

        <SectionTitle title="通知する日" />
        <View style={styles.card}>
          {notifyOptions.map((day) => {
            const checked = settings.notifyDays.includes(day);
            return (
              <Pressable key={day} style={styles.notifyRow} onPress={() => toggleNotify(day)}>
                <Text style={styles.check}>{checked ? "✓" : "□"}</Text>
                <Text style={styles.notifyText}>{day}日前</Text>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton title="通知を試す" onPress={sendTestNotification} />

        <SectionTitle title="プラン" />
        <View style={styles.card}>
          <Text style={styles.line}>現在のプラン: 無料</Text>
          <Text style={styles.subLine}>食品登録: {currentPlan === "premium" ? "無制限" : `${FREE_STOCK_ITEM_LIMIT}件まで`}</Text>
          <Text style={styles.subLine}>広告: {canUseFeature(currentPlan, "adFree") ? "なし" : "あり"}</Text>
          <Text style={styles.subLine}>備蓄管理: 無料で利用可</Text>
          <Text style={styles.subLine}>防災バッグ管理: 無料で利用可</Text>
          <Text style={styles.subLine}>家族共有: {canUseFeature(currentPlan, "familyShare") ? "利用可" : "家族で同じ冷蔵庫リストを共有"}</Text>
          <Text style={styles.subLine}>複数端末同期: {canUseFeature(currentPlan, "cloudSync") ? "利用可" : "買い物中も家の在庫を確認"}</Text>
          <Text style={styles.subLine}>バーコード読み取り: 利用可</Text>
          <Text style={styles.subLine}>レシート読み取り: {currentPlan === "premium" ? "無制限" : `買ったものをまとめて登録（月${FREE_RECEIPT_SCAN_MONTHLY_LIMIT}回・1回${FREE_RECEIPT_IMPORT_ITEM_LIMIT}件まで）`}</Text>
        </View>

        <SectionTitle title="保存内容の管理" />
        <PrimaryButton title="お試し内容を入れる" onPress={confirmSample} />
        <DangerButton title="最初の状態に戻す" onPress={confirmReset} />
      </View>
    </ScrollView>
  );
}

function Stepper({ label, value, unit, onMinus, onPlus }: { label: string; value: number; unit: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <PrimaryButton title="−" onPress={onMinus} />
        <Text style={styles.stepperValue}>{value}{unit}</Text>
        <PrimaryButton title="＋" onPress={onPlus} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 10 },
  guideCard: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 10 },
  guideTitle: { color: colors.primary, fontSize: 17, fontWeight: "900" },
  guideText: { color: colors.textMain, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  stepperLabel: { color: colors.textMain, fontSize: 16, fontWeight: "800" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperValue: { color: colors.textMain, fontSize: 22, fontWeight: "800", minWidth: 90, textAlign: "center" },
  notifyRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 42 },
  check: { color: colors.primary, fontSize: 22, fontWeight: "900", width: 28 },
  notifyText: { color: colors.textMain, fontSize: 17, fontWeight: "800" },
  line: { color: colors.textMain, fontSize: 16, fontWeight: "800" },
  subLine: { color: colors.textSub, fontSize: 14 }
});
