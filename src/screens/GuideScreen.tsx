import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { appGuideSections } from "../constants/appGuide";
import { Header } from "../components/Header";
import { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Guide">;

export function GuideScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="使い方ガイド" subtitle="たべきりポッケの基本操作を確認できます" />
      <View style={styles.wrap}>
        {appGuideSections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.description}>{section.description}</Text>
            {section.items.map((item) => (
              <View key={item} style={styles.itemRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 15, gap: 8 },
  title: { color: colors.textMain, fontSize: 18, fontWeight: "900" },
  description: { color: colors.textSub, fontSize: 14, lineHeight: 21, fontWeight: "700" },
  itemRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bullet: { color: colors.primary, fontSize: 16, fontWeight: "900", lineHeight: 21 },
  itemText: { color: colors.textMain, fontSize: 14, lineHeight: 21, flex: 1 }
});
