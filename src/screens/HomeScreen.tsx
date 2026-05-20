import React, { useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { MenuCard } from "../components/MenuCard";
import { SectionTitle } from "../components/SectionTitle";
import { SummaryCard } from "../components/SummaryCard";
import { RootStackParamList } from "../types";
import { useAppData } from "../services/AppDataContext";
import { getDaysUntilExpiry, sortByExpiry } from "../utils/expiryUtils";
import { calculatePreparednessScore } from "../utils/scoreUtils";
import { StockItemCard } from "../components/StockItemCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { AdBanner } from "../components/AdBanner";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(360)).current;
  const scoreTranslateY = useRef(new Animated.Value(360)).current;
  const { stockItems, emergencyBagItems, shoppingItems, settings } = useAppData();
  const score = calculatePreparednessScore(stockItems, emergencyBagItems, settings);
  const urgentItems = sortByExpiry(stockItems).filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days <= 90;
  }).slice(0, 3);
  const expiringSoon = stockItems.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days <= 30;
  }).length;
  const scoreTone = score.score >= 80 ? colors.success : score.score >= 50 ? colors.warning : colors.danger;
  const activeShoppingItems = shoppingItems.filter((item) => !item.checked).length;

  function openMenu(): void {
    setMenuVisible(true);
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 28,
      bounciness: 5
    }).start();
  }

  function closeMenu(): void {
    Animated.timing(sheetTranslateY, {
      toValue: 360,
      duration: 180,
      useNativeDriver: true
    }).start(() => setMenuVisible(false));
  }

  function openScore(): void {
    setScoreVisible(true);
    Animated.spring(scoreTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 28,
      bounciness: 5
    }).start();
  }

  function closeScore(): void {
    Animated.timing(scoreTranslateY, {
      toValue: 360,
      duration: 180,
      useNativeDriver: true
    }).start(() => setScoreVisible(false));
  }

  function navigateFromMenu(screen: keyof RootStackParamList): void {
    closeMenu();
    navigation.navigate(screen as never);
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topTitle}>
            <Text style={styles.appName}>たべきりポッケ</Text>
            <Text style={styles.appSub}>冷蔵庫から備蓄まで、食品の期限と買い物を管理</Text>
          </View>
          <Pressable style={styles.menuButton} onPress={openMenu}>
            <Text style={styles.menuButtonIcon}>≡</Text>
            <Text style={styles.menuButtonText}>メニュー</Text>
          </Pressable>
        </View>
        <View style={styles.hero}>
          <Pressable style={styles.heroTop} onPress={openScore}>
            <View>
              <Text style={styles.heroLabel}>今日の食品ストック</Text>
              <Text style={[styles.heroScore, { color: scoreTone }]}>{score.score}点</Text>
            </View>
            <View style={[styles.scoreRing, { borderColor: scoreTone }]}>
              <Text style={[styles.scoreRingText, { color: scoreTone }]}>{score.score >= 80 ? "良好" : score.score >= 50 ? "注意" : "要確認"}</Text>
            </View>
          </Pressable>
          <Text style={styles.heroMessage}>{score.messages[0]}</Text>
          <View style={styles.heroActions}>
            <PrimaryButton title="食品を追加" onPress={() => navigation.navigate("StockForm")} />
            <PrimaryButton title="消費プラン" variant="soft" onPress={() => navigation.navigate("ExpiryCheck")} />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="登録済み食品" value={stockItems.length} onPress={() => navigation.navigate("StockList")} />
          <SummaryCard label="期限30日以内" value={expiringSoon} tone={expiringSoon > 0 ? "yellow" : "success"} onPress={() => navigation.navigate("ExpiryCheck")} />
          <SummaryCard label="買い物リスト" value={activeShoppingItems} tone={activeShoppingItems > 0 ? "primary" : "success"} onPress={() => navigation.navigate("ShoppingList")} />
          <SummaryCard label="保管場所" value="見る" tone="bag" onPress={() => navigation.navigate("LocationView")} />
        </View>
        <View style={styles.adWrap}><AdBanner /></View>

        <View style={styles.scoreBox}>
          {score.messages.slice(0, 2).map((message) => <MenuCard key={message} icon="!" title={message} description="必要な画面で詳しく確認できます" onPress={() => navigation.navigate("RequirementCheck")} compact />)}
        </View>

        <SectionTitle title="期限が近い食品" />
        <View style={styles.urgent}>
          {urgentItems.length === 0 ? (
            <View style={styles.emptyPanel}><Text style={styles.emptyText}>90日以内に確認が必要な食品はありません</Text></View>
          ) : urgentItems.map((item) => (
            <StockItemCard key={item.id} item={item} onPress={() => navigation.navigate("StockForm", { itemId: item.id })} />
          ))}
        </View>

        <SectionTitle title="よく使う操作" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          <PrimaryButton title="バーコードで登録" variant="soft" onPress={() => navigation.navigate("BarcodeScan")} />
          <PrimaryButton title="期限チェック" variant="soft" onPress={() => navigation.navigate("ExpiryCheck")} />
          <PrimaryButton title="買い物リスト" variant="soft" onPress={() => navigation.navigate("ShoppingList")} />
          <PrimaryButton title="場所ごとに見る" variant="soft" onPress={() => navigation.navigate("LocationView")} />
        </ScrollView>

      </ScrollView>
      <Modal transparent visible={menuVisible} animationType="none" onRequestClose={closeMenu}>
        <Pressable style={styles.backdrop} onPress={closeMenu} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>メニュー</Text>
            <Pressable style={styles.closeButton} onPress={closeMenu}>
              <Text style={styles.closeText}>閉じる</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.sheetSubTitle}>日常の管理</Text>
            <MenuCard icon="+" title="食品を追加" description="買ってきた食品を登録" onPress={() => navigateFromMenu("StockForm")} compact />
            <MenuCard icon="□" title="食品ストック一覧" description="冷蔵庫、冷凍庫、常温の食品を確認" onPress={() => navigateFromMenu("StockList")} compact />
            <MenuCard icon="!" title="期限チェック" description="期限切れや期限間近を確認" onPress={() => navigateFromMenu("ExpiryCheck")} compact />
            <MenuCard icon="+" title="買い物リスト" description="不足と期限間近から自動作成" onPress={() => navigateFromMenu("ShoppingList")} compact />
            <MenuCard icon="*" title="よく買うもの" description="買い物リストへ追加" onPress={() => navigateFromMenu("ShoppingTemplates")} compact />
            <MenuCard icon="⌂" title="場所ごとに見る" description="保管場所ごとに確認" onPress={() => navigateFromMenu("LocationView")} compact />
            <MenuCard icon="|" title="バーコード読み取り" description="バーコードで食品を登録" onPress={() => navigateFromMenu("BarcodeScan")} compact />

            <Text style={styles.sheetSubTitle}>記録・設定</Text>
            <MenuCard icon="≡" title="履歴" description="使った・買った・点検した記録" onPress={() => navigateFromMenu("History")} compact />
            <MenuCard icon="?" title="使い方ガイド" description="基本操作をもう一度見る" onPress={() => navigateFromMenu("Guide")} compact />
            <MenuCard icon="⚙" title="設定" description="人数・通知・お試し内容" onPress={() => navigateFromMenu("Settings")} compact />

            <Text style={styles.sheetSubTitle}>備蓄・防災</Text>
            <MenuCard icon="%" title="備蓄必要量チェック" description="家族人数に応じた不足量を確認" onPress={() => navigateFromMenu("RequirementCheck")} compact />
            <MenuCard icon="✓" title="防災バッグ" description="持ち出し袋の中身を確認" onPress={() => navigateFromMenu("EmergencyBag")} compact />
            <MenuCard icon="○" title="防災備蓄リスト" description="まずそろえたい備蓄を確認" onPress={() => navigateFromMenu("BeginnerGuide")} compact />
          </ScrollView>
        </Animated.View>
      </Modal>
      <Modal transparent visible={scoreVisible} animationType="none" onRequestClose={closeScore}>
        <Pressable style={styles.backdrop} onPress={closeScore} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: scoreTranslateY }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>点数の理由</Text>
            <Pressable style={styles.closeButton} onPress={closeScore}>
              <Text style={styles.closeText}>閉じる</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.scoreSheetContent}>
            <View style={styles.scoreDetailHero}>
              <Text style={[styles.scoreDetailValue, { color: scoreTone }]}>{score.score}点</Text>
              <Text style={styles.scoreDetailText}>100点から、不足や期限が近いものを引いています。</Text>
            </View>
            <View style={styles.scoreDetails}>
              {score.details.map((detail) => (
                <View key={detail.label} style={styles.scoreDetailRow}>
                  <Text style={styles.scoreDetailLabel}>{detail.label}</Text>
                  <Text style={[styles.scoreDetailPoint, { color: colors[detail.tone] }]}>{detail.points === 0 ? "OK" : `${detail.points}点`}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  topBar: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  topTitle: { flex: 1 },
  appName: { color: colors.textMain, fontSize: 28, fontWeight: "900" },
  appSub: { color: colors.textSub, fontSize: 14, marginTop: 4, lineHeight: 20 },
  menuButton: { minWidth: 92, minHeight: 48, borderRadius: 8, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, shadowColor: colors.shadow, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  menuButtonIcon: { color: colors.card, fontSize: 22, fontWeight: "900", lineHeight: 22 },
  menuButtonText: { color: colors.card, fontSize: 12, fontWeight: "800", marginTop: 1 },
  hero: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  heroLabel: { color: colors.textSub, fontSize: 15, fontWeight: "800" },
  heroScore: { fontSize: 44, fontWeight: "900", marginTop: 2 },
  scoreRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 7, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  scoreRingText: { fontSize: 14, fontWeight: "900" },
  heroMessage: { color: colors.textMain, fontSize: 16, fontWeight: "700", lineHeight: 23 },
  heroActions: { gap: 9 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, paddingHorizontal: 20 },
  scoreBox: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  adWrap: { paddingHorizontal: 20, paddingTop: 12 },
  urgent: { paddingHorizontal: 20, gap: 10, marginBottom: 2 },
  emptyPanel: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16 },
  emptyText: { color: colors.textSub, fontSize: 15, fontWeight: "700" },
  quickActions: { paddingHorizontal: 20, gap: 10, paddingBottom: 2 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "82%", backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 18 },
  sheetHandle: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { color: colors.textMain, fontSize: 22, fontWeight: "900" },
  sheetSubTitle: { color: colors.textSub, fontSize: 14, fontWeight: "900" },
  closeButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  closeText: { color: colors.textMain, fontWeight: "800" },
  sheetContent: { gap: 10, paddingBottom: 20 }
  ,
  scoreSheetContent: { paddingBottom: 24 },
  scoreDetailHero: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, marginBottom: 12 },
  scoreDetailValue: { fontSize: 40, fontWeight: "900" },
  scoreDetailText: { color: colors.textSub, fontSize: 14, lineHeight: 20, marginTop: 4 },
  scoreDetails: { gap: 10, paddingBottom: 12 },
  scoreDetailRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  scoreDetailLabel: { color: colors.textMain, fontSize: 15, fontWeight: "800", flex: 1 },
  scoreDetailPoint: { fontSize: 16, fontWeight: "900" }
});
