import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export function SummaryCard({
  label,
  value,
  tone = "primary",
  onPress
}: {
  label: string;
  value: string | number;
  tone?: "primary" | "danger" | "warning" | "yellow" | "bag" | "success";
  onPress?: () => void;
}) {
  const accent = colors[tone];
  const content = (
    <>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.card, { borderLeftColor: accent }, pressed && styles.pressed]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.5%",
    backgroundColor: colors.card,
    borderRadius: 8,
    borderLeftWidth: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  value: { fontSize: 24, fontWeight: "900" },
  label: { color: colors.textSub, fontSize: 12, marginTop: 4, fontWeight: "800", lineHeight: 17 }
});
