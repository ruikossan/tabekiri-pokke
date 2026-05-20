import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export function MenuCard({
  icon,
  title,
  description,
  onPress,
  compact = false
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function animate(toValue: number): void {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.card, compact && styles.compactCard]}
        onPress={onPress}
        onPressIn={() => animate(0.98)}
        onPressOut={() => animate(1)}
      >
        <View style={[styles.iconBox, compact && styles.compactIconBox]}><Text style={styles.icon}>{icon}</Text></View>
        <View style={styles.textBox}>
          <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
          <Text style={styles.description} numberOfLines={compact ? 1 : 2}>{description}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  compactCard: { padding: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  compactIconBox: { width: 38, height: 38 },
  icon: { fontSize: 22 },
  textBox: { flex: 1 },
  title: { color: colors.textMain, fontSize: 17, fontWeight: "800" },
  compactTitle: { fontSize: 16 },
  description: { color: colors.textSub, fontSize: 13, marginTop: 3 },
  arrow: { color: colors.primary, fontSize: 26, fontWeight: "700" }
});
