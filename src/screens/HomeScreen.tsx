import React, { useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { MenuCard } from "../components/MenuCard";
import { SectionTitle } from "../components/SectionTitle";
import { SummaryCard } from "../components/SummaryCard";
import { QuickActionId, RootStackParamList } from "../types";
import { useAppData } from "../services/AppDataContext";
import { getDaysUntilExpiry, sortByExpiry } from "../utils/expiryUtils";
import { StockItemCard } from "../components/StockItemCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { AdBanner } from "../components/AdBanner";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type MenuAction = {
  id: QuickActionId;
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
};

export function HomeScreen({ navigation }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);
  const [barcodeModeVisible, setBarcodeModeVisible] = useState(false);
  const [quickActionEditVisible, setQuickActionEditVisible] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(360)).current;
  const { stockItems, shoppingItems, settings, updateSettings, showToast } = useAppData();
  const urgentItems = sortByExpiry(stockItems).filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days <= 90;
  }).slice(0, 3);
  const expiringSoon = stockItems.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days <= 30;
  }).length;
  const activeShoppingItems = shoppingItems.filter((item) => !item.checked).length;
  const defaultQuickActionIds: QuickActionId[] = ["add", "barcode", "expiry", "shopping"];
  const savedQuickActionIds = Array.isArray(settings.quickActionIds) ? settings.quickActionIds : [];

  const menuActions: MenuAction[] = [
    { id: "add", icon: "+", title: "食品を追加", description: "登録方法を選んで追加", onPress: openAddOptionsFromMenu },
    { id: "stock", icon: "□", title: "食品ストック一覧", description: "登録済みの食品を確認", onPress: () => navigateFromMenu("StockList") },
    { id: "expiry", icon: "!", title: "期限チェック", description: "期限切れや期限間近を確認", onPress: () => navigateFromMenu("ExpiryCheck") },
    { id: "shopping", icon: "+", title: "買い物リスト", description: "買い足しを確認", onPress: () => navigateFromMenu("ShoppingList") },
    { id: "templates", icon: "*", title: "よく買うもの", description: "買い物リストへ追加", onPress: () => navigateFromMenu("ShoppingTemplates") },
    { id: "location", icon: "⌂", title: "場所ごとに見る", description: "保管場所ごとに確認", onPress: () => navigateFromMenu("LocationView") },
    { id: "barcode", icon: "|", title: "バーコード読み取り", description: "通常モードか連続撮影を選んで登録", onPress: openBarcodeModeFromMenu },
    { id: "history", icon: "≡", title: "履歴", description: "使った・買った・点検した記録", onPress: () => navigateFromMenu("History") },
    { id: "guide", icon: "?", title: "使い方ガイド", description: "基本操作をもう一度見る", onPress: () => navigateFromMenu("Guide") },
    { id: "settings", icon: "⚙", title: "設定", description: "通知やお試し内容を管理", onPress: () => navigateFromMenu("Settings") }
  ];
  const validActionIds = new Set(menuActions.map((action) => action.id));
  const sanitizedQuickActionIds = savedQuickActionIds.filter((id) => validActionIds.has(id));
  const selectedQuickActionIds = sanitizedQuickActionIds.length > 0 ? sanitizedQuickActionIds : defaultQuickActionIds;
  const visibleQuickActions = selectedQuickActionIds
    .map((id) => menuActions.find((action) => action.id === id))
    .filter((action): action is MenuAction => Boolean(action));

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

  function navigateFromMenu(screen: keyof RootStackParamList): void {
    closeMenu();
    navigation.navigate(screen as never);
  }

  function openAddOptions(): void {
    setAddOptionsVisible(true);
  }

  function closeAddOptions(): void {
    setAddOptionsVisible(false);
  }

  function openAddOptionsFromMenu(): void {
    closeMenu();
    setTimeout(() => setAddOptionsVisible(true), 220);
  }

  function openBarcodeMode(): void {
    setBarcodeModeVisible(true);
  }

  function openBarcodeModeFromMenu(): void {
    closeMenu();
    setTimeout(() => setBarcodeModeVisible(true), 220);
  }

  function closeBarcodeMode(): void {
    setBarcodeModeVisible(false);
  }

  function chooseBarcodeMode(mode: "normal" | "continuous"): void {
    closeBarcodeMode();
    navigation.navigate(mode === "normal" ? "BarcodeScan" : "ContinuousScan");
  }

  function toggleQuickAction(id: QuickActionId): void {
    const nextIds = selectedQuickActionIds.includes(id)
      ? selectedQuickActionIds.filter((currentId) => currentId !== id)
      : [...selectedQuickActionIds, id];

    if (nextIds.length === 0) {
      showToast("よく使う操作は1つ以上選んでください");
      return;
    }

    void updateSettings({ ...settings, quickActionIds: nextIds })
      .then(() => showToast("よく使う操作を更新しました"));
  }

  function chooseAddMethod(method: "favorite" | "barcode" | "manual"): void {
    closeAddOptions();
    if (method === "favorite") {
      navigation.navigate("ShoppingTemplates");
      return;
    }
    if (method === "manual") {
      navigation.navigate("StockForm");
      return;
    }
    if (method === "barcode") {
      openBarcodeMode();
      return;
    }
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topTitle}>
            <Text style={styles.appName}>たべきりポッケ</Text>
            <Text style={styles.appSub}>冷蔵庫から買い物まで、食品の期限と在庫を管理</Text>
          </View>
          <Pressable style={styles.menuButton} onPress={openMenu}>
            <Text style={styles.menuButtonIcon}>≡</Text>
            <Text style={styles.menuButtonText}>メニュー</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>登録済み食品</Text>
              <Text style={styles.heroScore}>{stockItems.length}件</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{expiringSoon > 0 ? "確認あり" : "順調"}</Text>
            </View>
          </View>
          <Text style={styles.heroMessage}>{expiringSoon > 0 ? `30日以内の期限が${expiringSoon}件あります` : "期限が近い食品はありません"}</Text>
          <View style={styles.heroActions}>
            <PrimaryButton title="食品を追加" onPress={openAddOptions} />
            <PrimaryButton title="期限チェック" variant="soft" onPress={() => navigation.navigate("ExpiryCheck")} />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="登録済み食品" value={stockItems.length} onPress={() => navigation.navigate("StockList")} />
          <SummaryCard label="期限30日以内" value={expiringSoon} tone={expiringSoon > 0 ? "yellow" : "success"} onPress={() => navigation.navigate("ExpiryCheck")} />
          <SummaryCard label="買い物リスト" value={activeShoppingItems} tone={activeShoppingItems > 0 ? "primary" : "success"} onPress={() => navigation.navigate("ShoppingList")} />
          <SummaryCard label="保管場所" value="見る" tone="bag" onPress={() => navigation.navigate("LocationView")} />
        </View>
        <View style={styles.adWrap}><AdBanner /></View>

        <SectionTitle title="期限が近い食品" />
        <View style={styles.urgent}>
          {urgentItems.length === 0 ? (
            <View style={styles.emptyPanel}><Text style={styles.emptyText}>90日以内に確認が必要な食品はありません</Text></View>
          ) : urgentItems.map((item) => (
            <StockItemCard key={item.id} item={item} onPress={() => navigation.navigate("StockForm", { itemId: item.id })} />
          ))}
        </View>

        <View style={styles.quickHeader}>
          <SectionTitle title="よく使う操作" />
          <Pressable style={styles.editQuickButton} onPress={() => setQuickActionEditVisible(true)}>
            <Text style={styles.editQuickButtonText}>編集</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          {visibleQuickActions.map((action) => (
            <PrimaryButton key={action.id} title={action.title} variant="soft" onPress={action.onPress} />
          ))}
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
            {menuActions.slice(0, 7).map((action) => (
              <MenuCard key={action.id} icon={action.icon} title={action.title} description={action.description} onPress={action.onPress} compact />
            ))}

            <Text style={styles.sheetSubTitle}>記録・設定</Text>
            {menuActions.slice(7).map((action) => (
              <MenuCard key={action.id} icon={action.icon} title={action.title} description={action.description} onPress={action.onPress} compact />
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>

      <Modal transparent visible={addOptionsVisible} animationType="fade" onRequestClose={closeAddOptions}>
        <Pressable style={styles.backdrop} onPress={closeAddOptions} />
        <View style={styles.addSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>食品を追加</Text>
            <Pressable style={styles.closeButton} onPress={closeAddOptions}>
              <Text style={styles.closeText}>閉じる</Text>
            </Pressable>
          </View>
          <View style={styles.addOptions}>
            <Text style={styles.addOptionGroupTitle}>基本の追加方法</Text>
            <AddMethodButton title="手入力で追加" description="名前・数量・期限を自分で入力します" onPress={() => chooseAddMethod("manual")} primary />
            <AddMethodButton title="バーコードで追加" description="商品のバーコードを読み取って登録します" onPress={() => chooseAddMethod("barcode")} />
            <Text style={styles.addOptionGroupTitle}>登録済みの商品から追加</Text>
            <AddMethodButton title="よく買うものから追加" description="登録済みの定番品を選びます" onPress={() => chooseAddMethod("favorite")} />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={barcodeModeVisible} animationType="fade" onRequestClose={closeBarcodeMode}>
        <Pressable style={styles.backdrop} onPress={closeBarcodeMode} />
        <View style={styles.addSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>バーコード読み取り</Text>
            <Pressable style={styles.closeButton} onPress={closeBarcodeMode}>
              <Text style={styles.closeText}>閉じる</Text>
            </Pressable>
          </View>
          <View style={styles.addOptions}>
            <AddMethodButton title="通常モードで読み取る" onPress={() => chooseBarcodeMode("normal")} primary />
            <AddMethodButton title="連続撮影でまとめて読み取る" onPress={() => chooseBarcodeMode("continuous")} />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={quickActionEditVisible} animationType="fade" onRequestClose={() => setQuickActionEditVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setQuickActionEditVisible(false)} />
        <View style={styles.addSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>よく使う操作を編集</Text>
            <Pressable style={styles.closeButton} onPress={() => setQuickActionEditVisible(false)}>
              <Text style={styles.closeText}>完了</Text>
            </Pressable>
          </View>
          <View style={styles.quickEditList}>
            {menuActions.map((action) => {
              const selected = selectedQuickActionIds.includes(action.id);
              return (
                <Pressable key={action.id} style={[styles.quickEditItem, selected && styles.quickEditItemSelected]} onPress={() => toggleQuickAction(action.id)}>
                  <View style={styles.quickEditTextBox}>
                    <Text style={styles.quickEditTitle}>{action.title}</Text>
                    <Text style={styles.quickEditDescription}>{action.description}</Text>
                  </View>
                  <View style={[styles.quickEditCheck, selected && styles.quickEditCheckSelected]}>
                    <Text style={[styles.quickEditCheckText, selected && styles.quickEditCheckTextSelected]}>{selected ? "ON" : "OFF"}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

function AddMethodButton({ title, description, onPress, primary = false }: { title: string; description?: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable style={[styles.addOptionButton, primary && styles.addOptionPrimary]} onPress={onPress}>
      <Text style={[styles.addOptionText, primary && styles.addOptionPrimaryText]}>{title}</Text>
      {description ? <Text style={[styles.addOptionDescription, primary && styles.addOptionPrimaryDescription]}>{description}</Text> : null}
    </Pressable>
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
  heroScore: { color: colors.primary, fontSize: 44, fontWeight: "900", marginTop: 2 },
  heroBadge: { minWidth: 76, minHeight: 76, borderRadius: 38, borderWidth: 7, borderColor: colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  heroBadgeText: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  heroMessage: { color: colors.textMain, fontSize: 16, fontWeight: "700", lineHeight: 23 },
  heroActions: { gap: 9 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, paddingHorizontal: 20 },
  adWrap: { display: "none" },
  urgent: { paddingHorizontal: 20, gap: 10, marginBottom: 2 },
  emptyPanel: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16 },
  emptyText: { color: colors.textSub, fontSize: 15, fontWeight: "700" },
  quickHeader: { paddingRight: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  editQuickButton: { minHeight: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  editQuickButtonText: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  quickActions: { paddingHorizontal: 20, gap: 10, paddingBottom: 2 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "82%", backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 18 },
  addSheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 24 },
  sheetHandle: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { color: colors.textMain, fontSize: 22, fontWeight: "900" },
  sheetSubTitle: { color: colors.textSub, fontSize: 14, fontWeight: "900" },
  closeButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  closeText: { color: colors.textMain, fontWeight: "800" },
  sheetContent: { gap: 10, paddingBottom: 20 },
  addOptions: { gap: 10 },
  addOptionGroupTitle: { color: colors.textSub, fontSize: 13, fontWeight: "900", marginTop: 2 },
  addOptionButton: { minHeight: 62, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "flex-start", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 10 },
  addOptionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  addOptionText: { color: colors.primary, fontSize: 16, fontWeight: "900" },
  addOptionPrimaryText: { color: colors.card },
  addOptionDescription: { color: colors.textSub, fontSize: 13, fontWeight: "700", marginTop: 4 },
  addOptionPrimaryDescription: { color: colors.card },
  quickEditList: { gap: 10 },
  quickEditItem: { minHeight: 64, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  quickEditItemSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  quickEditTextBox: { flex: 1 },
  quickEditTitle: { color: colors.textMain, fontSize: 16, fontWeight: "900" },
  quickEditDescription: { color: colors.textSub, fontSize: 13, fontWeight: "700", marginTop: 3 },
  quickEditCheck: { width: 52, minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  quickEditCheckSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickEditCheckText: { color: colors.textSub, fontSize: 12, fontWeight: "900" },
  quickEditCheckTextSelected: { color: colors.card }
});
