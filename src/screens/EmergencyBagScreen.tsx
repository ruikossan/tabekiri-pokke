import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { emergencyBagCategories } from "../constants/sampleData";
import { EmptyState } from "../components/EmptyState";
import { FormInput } from "../components/FormInput";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectButtonGroup } from "../components/SelectButtonGroup";
import { SummaryCard } from "../components/SummaryCard";
import { useAppData } from "../services/AppDataContext";

export function EmergencyBagScreen() {
  const { emergencyBagItems, setEmergencyBagItems, showToast } = useAppData();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("水・食料");
  const unchecked = emergencyBagItems.filter((item) => !item.checked).length;

  function toggle(id: string): void {
    const target = emergencyBagItems.find((item) => item.id === id);
    void setEmergencyBagItems(emergencyBagItems.map((item) => item.id === id ? { ...item, checked: !item.checked } : item))
      .then(() => showToast(target?.checked ? "未チェックに戻しました" : "チェックしました"));
  }

  function addItem(): void {
    if (!name.trim()) {
      Alert.alert("入力エラー", "追加する項目名を入力してください。");
      return;
    }
    void setEmergencyBagItems([{ id: `bag-${Date.now()}`, name: name.trim(), category, checked: false }, ...emergencyBagItems])
      .then(() => showToast("チェック項目を追加しました"));
    setName("");
  }

  function removeItem(id: string): void {
    Alert.alert("削除確認", "このチェック項目を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => void setEmergencyBagItems(emergencyBagItems.filter((item) => item.id !== id)).then(() => showToast("チェック項目を削除しました")) }
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="防災バッグ" subtitle="持ち出し袋の中身を確認します" />
      <View style={styles.wrap}>
        <SummaryCard label="未チェック項目" value={unchecked} tone={unchecked > 0 ? "bag" : "success"} />
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>この画面の役割</Text>
          <Text style={styles.infoText}>
            ここは「防災バッグに入っているべきもの」のチェックリストです。実際の数量や賞味期限を管理したいものは、食品として登録し、保管場所を「防災バッグ」にしてください。
          </Text>
        </View>
        <View style={styles.addCard}>
          <FormInput label="項目追加" value={name} onChangeText={setName} placeholder="例：雨具" />
          <SelectButtonGroup options={emergencyBagCategories} value={category} onChange={setCategory} />
          <PrimaryButton title="追加する" onPress={addItem} />
        </View>
        {emergencyBagItems.length === 0 ? <EmptyState title="項目がありません" message="必要な持ち出し品を追加してください。" /> : emergencyBagCategories.map((group) => {
          const items = emergencyBagItems.filter((item) => (item.category ?? "その他") === group);
          if (items.length === 0) return null;
          return (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>{group}</Text>
              {items.map((item) => (
                <Pressable key={item.id} style={[styles.row, item.checked && styles.checkedRow]} onPress={() => toggle(item.id)}>
                  <Text style={[styles.check, item.checked && styles.checkedText]}>{item.checked ? "✓" : "□"}</Text>
                  <Text style={[styles.name, item.checked && styles.checkedText]}>{item.name}</Text>
                  <Pressable onPress={() => removeItem(item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>削除</Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 10 },
  infoCard: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 6 },
  infoTitle: { color: colors.primary, fontSize: 16, fontWeight: "900" },
  infoText: { color: colors.textMain, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  addCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 12 },
  group: { gap: 8 },
  groupTitle: { color: colors.textMain, fontSize: 18, fontWeight: "800", marginTop: 8 },
  row: { minHeight: 58, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  checkedRow: { opacity: 0.55 },
  check: { color: colors.primary, fontSize: 22, fontWeight: "900", width: 28 },
  checkedText: { color: colors.textSub, textDecorationLine: "line-through" },
  name: { color: colors.textMain, fontSize: 17, fontWeight: "800", flex: 1 },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 7 },
  deleteText: { color: colors.danger, fontWeight: "800" }
});
