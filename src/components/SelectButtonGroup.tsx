import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export function SelectButtonGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable key={option} style={[styles.button, selected && styles.selected]} onPress={() => onChange(option)}>
            <Text style={[styles.text, selected && styles.selectedText]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.textSub, fontWeight: "700" },
  selectedText: { color: colors.card }
});
