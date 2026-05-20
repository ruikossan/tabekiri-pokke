import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { FormInput } from "../components/FormInput";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionTitle } from "../components/SectionTitle";
import { ShoppingItem, ShoppingTemplate } from "../types";
import { useAppData } from "../services/AppDataContext";

export function ShoppingTemplatesScreen() {
  const { shoppingTemplates, setShoppingTemplates, addShoppingItem, showToast } = useAppData();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("個");

  function addTemplate(): void {
    const parsedQuantity = Number(quantity);
    if (!name.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("入力エラー", "品名と正しい数量を入力してください。");
      return;
    }

    const template: ShoppingTemplate = {
      id: `template-${Date.now()}`,
      name: name.trim(),
      quantity: parsedQuantity,
      unit
    };
    void setShoppingTemplates([template, ...shoppingTemplates]).then(() => showToast("よく買うものに追加しました"));
    setName("");
    setQuantity("");
  }

  function addToShopping(template: ShoppingTemplate): void {
    const item: ShoppingItem = {
      id: `manual-${Date.now()}`,
      name: template.name,
      quantity: template.quantity,
      unit: template.unit,
      reason: "手動追加",
      checked: false,
      createdAt: new Date().toISOString()
    };
    void addShoppingItem(item).then(() => showToast("買い物リストに追加しました"));
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
          <FormInput label="数量" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="例：6" />
          <FormInput label="単位" value={unit} onChangeText={setUnit} placeholder="例：本" />
          <PrimaryButton title="よく買うものに追加" onPress={addTemplate} />
        </View>
        <SectionTitle title="登録済みのよく買うもの" />
        {shoppingTemplates.map((template) => (
          <View key={template.id} style={styles.card}>
            <Text style={styles.name}>{template.name}</Text>
            <Text style={styles.meta}>{template.quantity}{template.unit}</Text>
            <View style={styles.actions}>
              <PrimaryButton title="買い物リストへ追加" onPress={() => addToShopping(template)} />
              <PrimaryButton title="削除" onPress={() => removeTemplate(template.id)} />
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
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 8 },
  name: { color: colors.textMain, fontSize: 17, fontWeight: "800" },
  meta: { color: colors.textSub, fontSize: 14 },
  actions: { gap: 8 }
});
