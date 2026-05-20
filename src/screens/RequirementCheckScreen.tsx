import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionTitle } from "../components/SectionTitle";
import { useAppData } from "../services/AppDataContext";
import { calculateRequirements } from "../utils/stockCalculator";

export function RequirementCheckScreen() {
  const { stockItems, settings, updateSettings } = useAppData();
  const results = calculateRequirements(stockItems, settings);

  function changeSetting(key: "familySize" | "stockDays", delta: number): void {
    const nextValue = Math.max(1, settings[key] + delta);
    void updateSettings({ ...settings, [key]: nextValue });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="備蓄必要量チェック" subtitle="家族人数に応じた水・食料・簡易トイレの目安を確認します" />
      <>
      <View style={styles.settingsCard}>
        <SettingStepper label="家族人数" value={settings.familySize} unit="人" onMinus={() => changeSetting("familySize", -1)} onPlus={() => changeSetting("familySize", 1)} />
        <SettingStepper label="備蓄日数" value={settings.stockDays} unit="日" onMinus={() => changeSetting("stockDays", -1)} onPlus={() => changeSetting("stockDays", 1)} />
      </View>
      <View style={styles.wrap}>
        <SectionTitle title="現在の達成状況" />
        {results.map((result) => {
          const enough = result.shortage === 0;
          return (
            <View key={result.key} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.title}>{result.label}</Text>
                <Text style={[styles.rate, { color: enough ? colors.success : colors.danger }]}>{result.rate}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${result.rate}%`, backgroundColor: enough ? colors.success : colors.danger }]} />
              </View>
              <Text style={styles.line}>必要量 {result.required}{result.unit}</Text>
              <Text style={styles.line}>現在 {result.current}{result.unit}</Text>
              <Text style={[styles.shortage, { color: enough ? colors.success : colors.danger }]}>
                {enough ? "足りています" : `不足 ${result.shortage}${result.unit}`}
              </Text>
            </View>
          );
        })}
      </View>
      </>
    </ScrollView>
  );
}

function SettingStepper({ label, value, unit, onMinus, onPlus }: { label: string; value: number; unit: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <PrimaryButton title="−" onPress={onMinus} />
        <Text style={styles.stepperValue}>{value}{unit}</Text>
        <PrimaryButton title="＋" onPress={onPlus} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  settingsCard: { marginHorizontal: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 14 },
  wrap: { paddingHorizontal: 20, gap: 12 },
  stepper: { gap: 8 },
  stepperLabel: { color: colors.textMain, fontSize: 16, fontWeight: "800" },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperValue: { color: colors.textMain, fontSize: 22, fontWeight: "800", minWidth: 80, textAlign: "center" },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.textMain, fontSize: 20, fontWeight: "800" },
  rate: { fontSize: 26, fontWeight: "900" },
  progressTrack: { height: 12, borderRadius: 999, backgroundColor: colors.muted, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  line: { color: colors.textSub, fontSize: 15 },
  shortage: { fontSize: 18, fontWeight: "800" }
});
