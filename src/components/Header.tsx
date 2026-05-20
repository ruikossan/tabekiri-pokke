import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  title: { color: colors.textMain, fontSize: 29, fontWeight: "900" },
  subtitle: { color: colors.textSub, fontSize: 15, marginTop: 6, lineHeight: 22 }
});
