import React from "react";
import { addMonths, addYears, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isValid, parseISO, setYear, startOfMonth, startOfWeek } from "date-fns";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function CalendarDatePicker({ label, value, onChange }: Props) {
  const selectedDate = parseValue(value);
  const [visible, setVisible] = React.useState(false);
  const [displayMonth, setDisplayMonth] = React.useState(selectedDate ?? new Date());
  const [yearPickerOpen, setYearPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (selectedDate) {
      setDisplayMonth(selectedDate);
    }
  }, [value]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(displayMonth)),
    end: endOfWeek(endOfMonth(displayMonth))
  });
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 31 }, (_, index) => currentYear - 10 + index);

  function selectDate(date: Date): void {
    onChange(format(date, "yyyy-MM-dd"));
    setVisible(false);
  }

  function clearDate(): void {
    onChange("");
    setVisible(false);
  }

  function selectYear(year: number): void {
    setDisplayMonth((current) => setYear(current, year));
    setYearPickerOpen(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputButton} onPress={() => setVisible(true)}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>{value || "日付を選択"}</Text>
        <Text style={styles.calendarIcon}>▦</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Pressable style={styles.monthButton} onPress={() => setDisplayMonth((current) => addYears(current, -1))}>
                <Text style={styles.monthButtonText}>«</Text>
              </Pressable>
              <Pressable style={styles.yearButton} onPress={() => setYearPickerOpen((current) => !current)}>
                <Text style={styles.monthTitle}>{format(displayMonth, "yyyy年")}</Text>
                <Text style={styles.yearHint}>{yearPickerOpen ? "年を閉じる" : "年を選ぶ"}</Text>
              </Pressable>
              <Pressable style={styles.monthButton} onPress={() => setDisplayMonth((current) => addYears(current, 1))}>
                <Text style={styles.monthButtonText}>»</Text>
              </Pressable>
            </View>

            {yearPickerOpen ? (
              <ScrollView style={styles.yearList} contentContainerStyle={styles.yearGrid}>
                {yearOptions.map((year) => {
                  const selected = Number(format(displayMonth, "yyyy")) === year;
                  return (
                    <Pressable key={year} style={[styles.yearOption, selected && styles.yearOptionSelected]} onPress={() => selectYear(year)}>
                      <Text style={[styles.yearOptionText, selected && styles.yearOptionSelectedText]}>{year}年</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            <View style={styles.monthHeader}>
              <Pressable style={styles.monthSmallButton} onPress={() => setDisplayMonth((current) => addMonths(current, -1))}>
                <Text style={styles.monthSmallText}>‹ 前の月</Text>
              </Pressable>
              <Text style={styles.monthName}>{format(displayMonth, "M月")}</Text>
              <Pressable style={styles.monthSmallButton} onPress={() => setDisplayMonth((current) => addMonths(current, 1))}>
                <Text style={styles.monthSmallText}>次の月 ›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekLabels.map((day) => (
                <Text key={day} style={styles.weekLabel}>{day}</Text>
              ))}
            </View>

            <View style={styles.dayGrid}>
              {days.map((day) => {
                const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                const muted = !isSameMonth(day, displayMonth);
                const today = isSameDay(day, new Date());
                return (
                  <Pressable
                    key={day.toISOString()}
                    style={[styles.dayButton, selected && styles.daySelected, today && !selected && styles.dayToday]}
                    onPress={() => selectDate(day)}
                  >
                    <Text style={[styles.dayText, muted && styles.dayMuted, selected && styles.daySelectedText]}>{format(day, "d")}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={clearDate}>
                <Text style={styles.actionText}>未設定にする</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.closeButton]} onPress={() => setVisible(false)}>
                <Text style={[styles.actionText, styles.closeText]}>閉じる</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { color: colors.textMain, fontSize: 15, fontWeight: "800" },
  inputButton: {
    minHeight: 48,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  inputText: { color: colors.textMain, fontSize: 16, fontWeight: "800" },
  placeholder: { color: colors.textSub, fontWeight: "700" },
  calendarIcon: { color: colors.primary, fontSize: 22, fontWeight: "900" },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthButton: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  monthButtonText: { color: colors.primary, fontSize: 24, lineHeight: 30, fontWeight: "900" },
  yearButton: { alignItems: "center", justifyContent: "center" },
  monthTitle: { color: colors.textMain, fontSize: 20, fontWeight: "900" },
  yearHint: { color: colors.primary, fontSize: 12, fontWeight: "900", marginTop: 2 },
  yearList: { maxHeight: 152 },
  yearGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 2 },
  yearOption: { width: "31.7%", minHeight: 38, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  yearOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  yearOptionText: { color: colors.textMain, fontSize: 14, fontWeight: "900" },
  yearOptionSelectedText: { color: colors.card },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  monthSmallButton: { minHeight: 36, borderRadius: 8, paddingHorizontal: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  monthSmallText: { color: colors.primary, fontSize: 13, fontWeight: "900" },
  monthName: { color: colors.textMain, fontSize: 18, fontWeight: "900" },
  weekRow: { flexDirection: "row" },
  weekLabel: { flex: 1, color: colors.textSub, fontSize: 13, fontWeight: "900", textAlign: "center" },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  dayButton: { width: `${100 / 7}%`, height: 42, alignItems: "center", justifyContent: "center" },
  dayToday: { borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
  daySelected: { borderRadius: 8, backgroundColor: colors.primary },
  dayText: { color: colors.textMain, fontSize: 15, fontWeight: "800" },
  dayMuted: { color: colors.textSub, opacity: 0.44 },
  daySelectedText: { color: colors.card },
  actions: { gap: 8 },
  actionButton: { minHeight: 46, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  closeButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { color: colors.textMain, fontSize: 15, fontWeight: "900" },
  closeText: { color: colors.card }
});
