import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { beginnerStockSuggestions } from "../constants/sampleData";
import { colors } from "../constants/colors";
import { Header } from "../components/Header";
import { SectionTitle } from "../components/SectionTitle";
import { useAppData } from "../services/AppDataContext";

export function BeginnerGuideScreen() {
  const { stockItems } = useAppData();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="防災備蓄リスト" subtitle="まず何をそろえるか迷ったときの目安です" />
      <View style={styles.wrap}>
        <SectionTitle title="基本リスト" />
        {beginnerStockSuggestions.map((name) => {
          const registered = stockItems.some((item) => item.name.includes(name) || item.category.includes(name));
          return (
            <View key={name} style={[styles.row, registered && styles.doneRow]}>
              <Text style={[styles.check, registered && styles.doneText]}>{registered ? "✓" : "□"}</Text>
              <Text style={[styles.name, registered && styles.doneText]}>{name}</Text>
              <Text style={[styles.status, { color: registered ? colors.success : colors.warning }]}>{registered ? "登録あり" : "未登録"}</Text>
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
  row: { minHeight: 54, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  doneRow: { opacity: 0.72 },
  check: { color: colors.primary, fontSize: 20, fontWeight: "900", width: 28 },
  name: { flex: 1, color: colors.textMain, fontSize: 17, fontWeight: "800" },
  doneText: { color: colors.textSub },
  status: { fontSize: 13, fontWeight: "800" }
});
