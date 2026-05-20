import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getStatusColor } from "../utils/expiryUtils";
import { colors } from "../constants/colors";
import { ExpiryStatus } from "../types";

export function StatusBadge({ status }: { status: ExpiryStatus }) {
  const color = getStatusColor(status);
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}14` }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "800" }
});
