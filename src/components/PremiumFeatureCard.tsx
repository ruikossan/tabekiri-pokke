import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export function PremiumFeatureCard({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>プレミアム</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.list}>
        <Text style={styles.item}>買い物中に家の在庫を確認</Text>
        <Text style={styles.item}>家族で同じ冷蔵庫リストを共有</Text>
        <Text style={styles.item}>機種変更してもデータを引き継ぎ</Text>
        <Text style={styles.item}>広告なしでサッと登録</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 18,
    gap: 10
  },
  badge: { alignSelf: "flex-start", color: colors.bag, backgroundColor: colors.bagSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: "900" },
  title: { color: colors.textMain, fontSize: 22, fontWeight: "900" },
  message: { color: colors.textSub, fontSize: 14, lineHeight: 21, fontWeight: "700" },
  list: { gap: 6, paddingTop: 2 },
  item: { color: colors.textMain, fontSize: 14, fontWeight: "800" }
});
