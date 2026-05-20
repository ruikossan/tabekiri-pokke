import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { categories } from "../constants/categories";
import { colors } from "../constants/colors";
import { locations } from "../constants/locations";
import { EmptyState } from "../components/EmptyState";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusBadge } from "../components/StatusBadge";
import { AdBanner } from "../components/AdBanner";
import { RootStackParamList, StockItem } from "../types";
import { useAppData } from "../services/AppDataContext";
import { getDaysUntilExpiry, getExpiryStatus, getStatusColor, sortByExpiry } from "../utils/expiryUtils";
import { canAddStockItem, currentPlan, getRemainingFreeItems } from "../utils/featureGate";

type Props = NativeStackScreenProps<RootStackParamList, "StockList">;

export function StockListScreen({ navigation }: Props) {
  const { stockItems, deleteStockItem } = useAppData();
  const [category, setCategory] = useState("すべて");
  const [location, setLocation] = useState("すべて");

  const filtered = useMemo(() => sortByExpiry(stockItems.filter((item) => {
    const categoryOk = category === "すべて" || item.category === category;
    const locationOk = location === "すべて" || item.location === location;
    return categoryOk && locationOk;
  })), [stockItems, category, location]);
  const urgentCount = useMemo(() => filtered.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days <= 30;
  }).length, [filtered]);
  const remainingFreeItems = getRemainingFreeItems(currentPlan, stockItems.length);
  const canAdd = canAddStockItem(currentPlan, stockItems.length);

  function addItem(): void {
    if (!canAdd) {
      Alert.alert("登録できません", "現在は食品を追加できません。時間をおいてもう一度お試しください。");
      return;
    }
    navigation.navigate("StockForm");
  }

  function confirmDelete(id: string): void {
    Alert.alert("削除確認", "この食品を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => void deleteStockItem(id) }
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="食品ストック一覧" subtitle="冷蔵庫、冷凍庫、常温の食品をまとめて確認します" />
      <View style={styles.actions}>
        <PrimaryButton title={canAdd ? "食品を追加" : "追加できません"} onPress={addItem} disabled={!canAdd} />
      </View>
      <View style={styles.summaryRow}>
        <ListSummary label="表示中" value={filtered.length} />
        <ListSummary label="30日以内" value={urgentCount} tone={urgentCount > 0 ? "yellow" : "success"} />
        <ListSummary label="登録上限" value={remainingFreeItems ?? "∞"} tone={remainingFreeItems === 0 ? "danger" : "primary"} />
      </View>
      <View style={styles.adWrap}><AdBanner /></View>
      <View style={styles.filters}>
        <FilterSelect label="カテゴリ" value={category} options={["すべて", ...categories]} onChange={setCategory} />
        <FilterSelect label="保管場所" value={location} options={["すべて", ...locations]} onChange={setLocation} />
      </View>

      <View style={styles.list}>
        {filtered.length === 0 ? <EmptyState title="食品がありません" message="追加ボタンから食品を登録してください。" /> : filtered.map((item) => (
          <StockListRow
            key={item.id}
            item={item}
            onEdit={() => navigation.navigate("StockForm", { itemId: item.id })}
            onDelete={() => confirmDelete(item.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);

  function selectOption(option: string): void {
    onChange(option);
    setOpen(false);
  }

  return (
    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable style={styles.filterButton} onPress={() => setOpen(true)}>
        <Text style={styles.filterValue}>{value}</Text>
        <Text style={styles.filterIcon}>▼</Text>
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
        <View style={styles.optionSheet}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>{label}</Text>
            <Pressable style={styles.optionClose} onPress={() => setOpen(false)}>
              <Text style={styles.optionCloseText}>閉じる</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.optionList}>
            {options.map((option) => {
              const selected = option === value;
              return (
                <Pressable key={option} style={[styles.optionRow, selected && styles.optionRowSelected]} onPress={() => selectOption(option)}>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                  {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function ListSummary({ label, value, tone = "primary" }: { label: string; value: string | number; tone?: "primary" | "success" | "warning" | "yellow" | "bag" | "danger" }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors[tone] }]}>{value}</Text>
    </View>
  );
}

function StockListRow({ item, onEdit, onDelete }: { item: StockItem; onEdit: () => void; onDelete: () => void }) {
  const status = getExpiryStatus(item.expiryDate);
  const statusColor = getStatusColor(status);
  const days = getDaysUntilExpiry(item.expiryDate);
  const expiryText = days === undefined ? "期限なし" : days < 0 ? `${Math.abs(days)}日超過` : `あと${days}日`;

  return (
    <Pressable style={[styles.itemCard, { borderLeftColor: statusColor }]} onPress={onEdit}>
      <View style={styles.itemMain}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbText}>{item.category.slice(0, 1)}</Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <StatusBadge status={status} />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>場所: {item.location}</Text>
            <Text style={styles.metaText} numberOfLines={1}>分類: {item.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.quantity}>{item.quantity}{item.unit}</Text>
            <Text style={[styles.expiryText, { color: statusColor }]}>{expiryText}</Text>
            <Text style={styles.dateText}>{item.expiryDate ?? "未設定"}</Text>
          </View>
          {item.inspectionDate ? <Text style={styles.inspectionText}>次回点検: {item.inspectionDate}</Text> : null}
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable style={styles.smallButton} onPress={onEdit}>
          <Text style={styles.smallButtonText}>編集</Text>
        </Pressable>
        <Pressable style={[styles.smallButton, styles.deleteSmallButton]} onPress={onDelete}>
          <Text style={[styles.smallButtonText, styles.deleteSmallButtonText]}>削除</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  actions: { paddingHorizontal: 20 },
  summaryRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 12 },
  summaryCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  summaryLabel: { color: colors.textSub, fontSize: 12, fontWeight: "800" },
  summaryValue: { color: colors.primary, fontSize: 24, fontWeight: "900", marginTop: 2 },
  filters: { paddingHorizontal: 20, paddingTop: 14, flexDirection: "row", gap: 10 },
  adWrap: { paddingHorizontal: 20, paddingTop: 12 },
  filterField: { flex: 1, gap: 6 },
  filterLabel: { color: colors.textMain, fontSize: 13, fontWeight: "900" },
  filterButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  filterValue: { flex: 1, color: colors.textMain, fontSize: 15, fontWeight: "800" },
  filterIcon: { color: colors.textSub, fontSize: 12, fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: colors.backdrop },
  optionSheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "72%", backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  optionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  optionTitle: { color: colors.textMain, fontSize: 21, fontWeight: "900" },
  optionClose: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: "center", paddingHorizontal: 14 },
  optionCloseText: { color: colors.textMain, fontWeight: "800" },
  optionList: { gap: 8, paddingBottom: 10 },
  optionRow: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  optionRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { color: colors.textMain, fontSize: 16, fontWeight: "800" },
  optionTextSelected: { color: colors.primary },
  optionCheck: { color: colors.primary, fontSize: 18, fontWeight: "900" },
  list: { paddingHorizontal: 20, gap: 12, paddingTop: 14 },
  itemCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  itemMain: { flexDirection: "row", gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.muted },
  thumbPlaceholder: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
  thumbText: { color: colors.textSub, fontSize: 22, fontWeight: "900" },
  itemInfo: { flex: 1, gap: 7 },
  itemTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  itemName: { flex: 1, color: colors.textMain, fontSize: 17, lineHeight: 23, fontWeight: "900" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaText: { color: colors.textSub, fontSize: 13, fontWeight: "700" },
  detailRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 10, rowGap: 3 },
  quantity: { color: colors.primary, fontSize: 20, fontWeight: "900" },
  expiryText: { fontSize: 15, fontWeight: "900" },
  dateText: { color: colors.textSub, fontSize: 13, fontWeight: "700" },
  inspectionText: { color: colors.textSub, fontSize: 12, fontWeight: "700" },
  rowActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  smallButton: { minWidth: 64, minHeight: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  smallButtonText: { color: colors.primary, fontWeight: "900" },
  deleteSmallButton: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  deleteSmallButtonText: { color: colors.danger }
});
