import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { currentPlan } from "../utils/featureGate";

export function AdBanner() {
  if (currentPlan !== "free") return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.label}>広告</Text>
      <Text style={styles.text}>無料でもすべての管理機能を使えます。プレミアムなら買い物中も家族と在庫を共有でき、機種変更してもデータを引き継げます。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 4
  },
  label: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  text: { color: colors.textMain, fontSize: 13, lineHeight: 19, fontWeight: "700" }
});
