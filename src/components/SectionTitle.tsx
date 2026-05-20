import React from "react";
import { StyleSheet, Text } from "react-native";
import { colors } from "../constants/colors";

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: { color: colors.textMain, fontSize: 18, fontWeight: "900", marginBottom: 9, marginTop: 18, paddingHorizontal: 20 }
});
