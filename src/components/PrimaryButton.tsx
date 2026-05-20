import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../constants/colors";

export function PrimaryButton({ title, onPress, disabled = false, variant = "solid" }: { title: string; onPress: () => void; disabled?: boolean; variant?: "solid" | "soft" }) {
  const scale = useRef(new Animated.Value(1)).current;

  function animate(toValue: number): void {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 35, bounciness: 2 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.button, variant === "soft" && styles.softButton, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
      >
        <Text style={[styles.text, variant === "soft" && styles.softText]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.primary, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  softButton: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.45 },
  text: { color: colors.card, fontSize: 16, fontWeight: "800" },
  softText: { color: colors.primary }
});
