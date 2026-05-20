import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { colors } from "../constants/colors";

export function ToastMessage({ message, onHide }: { message: string; onHide: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true })
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 12, duration: 180, useNativeDriver: true })
      ]).start(onHide);
    }, 2600);

    return () => clearTimeout(timer);
  }, [opacity, translateY, onHide]);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 58,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 100
  },
  icon: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.card, color: colors.success, textAlign: "center", lineHeight: 26, fontSize: 16, fontWeight: "900" },
  text: { color: colors.card, fontSize: 16, fontWeight: "900", flex: 1, lineHeight: 22 }
});
