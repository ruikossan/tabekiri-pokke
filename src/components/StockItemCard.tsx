import React, { useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { StockItem } from "../types";
import { getExpiryStatus } from "../utils/expiryUtils";
import { StatusBadge } from "./StatusBadge";

export function StockItemCard({ item, onPress }: { item: StockItem; onPress?: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function animate(toValue: number): void {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 35, bounciness: 3 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={() => animate(0.985)}
        onPressOut={() => animate(1)}
      >
        {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.image} /> : null}
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <StatusBadge status={getExpiryStatus(item.expiryDate)} />
        </View>
        <Text style={styles.meta}>{item.category} / {item.location}</Text>
        <View style={styles.bottom}>
          <View>
            <Text style={styles.quantity}>{item.quantity}{item.unit}</Text>
            {item.barcode ? <Text style={styles.subInfo}>バーコード番号: {item.barcode}</Text> : null}
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>賞味期限</Text>
            <Text style={styles.expiry}>{item.expiryDate ?? "期限なし"}</Text>
          </View>
        </View>
        {item.inspectionDate ? <Text style={styles.subInfo}>次回点検日: {item.inspectionDate}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    gap: 9,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  image: { width: "100%", height: 150, borderRadius: 8, backgroundColor: colors.muted },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
  name: { color: colors.textMain, fontSize: 18, fontWeight: "800", flex: 1 },
  meta: { color: colors.textSub, fontSize: 14 },
  bottom: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "center" },
  quantity: { color: colors.primary, fontSize: 19, fontWeight: "800" },
  subInfo: { color: colors.textSub, fontSize: 13, marginTop: 2 },
  dateBox: { alignItems: "flex-end", backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  dateLabel: { color: colors.textSub, fontSize: 11, fontWeight: "800" },
  expiry: { color: colors.textMain, fontSize: 13, fontWeight: "800", marginTop: 2 }
});
