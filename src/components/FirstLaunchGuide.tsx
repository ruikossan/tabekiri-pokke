import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { PrimaryButton } from "./PrimaryButton";

export function FirstLaunchGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>たべきりポッケの使い方</Text>
          <GuideStep number="1" title="食品を登録" message="冷蔵庫、冷凍庫、常温の食品を数量と期限つきで登録します。" />
          <GuideStep number="2" title="期限を確認" message="期限切れや期限が近い食品を、毎日の食事に回しやすくします。" />
          <GuideStep number="3" title="買い物を見る" message="買い足したい食品を、買い物リストでまとめて確認します。" />
          <PrimaryButton title="はじめる" onPress={onClose} />
          <Pressable onPress={onClose} style={styles.skip}>
            <Text style={styles.skipText}>あとで確認する</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function GuideContent({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>たべきりポッケの使い方</Text>
      <GuideStep number="1" title="食品を登録" message="冷蔵庫、冷凍庫、常温の食品を数量と期限つきで登録します。" />
      <GuideStep number="2" title="期限を確認" message="期限切れや期限が近い食品を、毎日の食事に回しやすくします。" />
      <GuideStep number="3" title="買い物を見る" message="買い足したい食品を、買い物リストでまとめて確認します。" />
      <PrimaryButton title="閉じる" onPress={onClose} />
    </View>
  );
}

function GuideStep({ number, title, message }: { number: string; title: string; message: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.number}><Text style={styles.numberText}>{number}</Text></View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepMessage}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.backdrop, alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", backgroundColor: colors.card, borderRadius: 8, padding: 20, gap: 14 },
  title: { color: colors.textMain, fontSize: 24, fontWeight: "900", marginBottom: 2 },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: colors.background, borderRadius: 8, padding: 12 },
  number: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  numberText: { color: colors.card, fontWeight: "900" },
  stepText: { flex: 1 },
  stepTitle: { color: colors.textMain, fontSize: 16, fontWeight: "900" },
  stepMessage: { color: colors.textSub, fontSize: 14, lineHeight: 20, marginTop: 3 },
  skip: { alignItems: "center", paddingVertical: 4 },
  skipText: { color: colors.textSub, fontSize: 14, fontWeight: "800" }
});
