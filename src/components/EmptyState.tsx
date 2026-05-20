import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.card, borderRadius: 8, padding: 22, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  title: { color: colors.textMain, fontSize: 18, fontWeight: "800" },
  message: { color: colors.textSub, fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 21 }
});
