import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../constants/colors";

export function DangerButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.danger, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, alignItems: "center" },
  pressed: { opacity: 0.75 },
  text: { color: colors.card, fontSize: 15, fontWeight: "800" }
});
