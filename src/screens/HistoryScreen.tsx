import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { EmptyState } from "../components/EmptyState";
import { Header } from "../components/Header";
import { SectionTitle } from "../components/SectionTitle";
import { useAppData } from "../services/AppDataContext";

export function HistoryScreen() {
  const { stockHistoryItems } = useAppData();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="使った・買った履歴" subtitle="消費、購入、点検の記録を確認します" />
      <View style={styles.wrap}>
        <SectionTitle title="履歴" />
        {stockHistoryItems.length === 0 ? (
          <EmptyState title="履歴はまだありません" message="消費済み、購入済み、点検完了の操作をすると履歴が残ります。" />
        ) : stockHistoryItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.date}>{item.createdAt.slice(0, 10)}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.quantity ? `${item.quantity}${item.unit ?? ""}` : "数量なし"}</Text>
            {item.memo ? <Text style={styles.memo}>{item.memo}</Text> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 10 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 5 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  type: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  date: { color: colors.textSub, fontSize: 13 },
  name: { color: colors.textMain, fontSize: 17, fontWeight: "800" },
  meta: { color: colors.textSub, fontSize: 14 },
  memo: { color: colors.textSub, fontSize: 13, lineHeight: 19 }
});
