import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors } from "../constants/colors";
import { locations } from "../constants/locations";
import { EmptyState } from "../components/EmptyState";
import { Header } from "../components/Header";
import { SectionTitle } from "../components/SectionTitle";
import { StockItemCard } from "../components/StockItemCard";
import { useAppData } from "../services/AppDataContext";

export function LocationViewScreen() {
  const { stockItems } = useAppData();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header title="場所ごとに見る" subtitle="冷蔵庫、冷凍庫、常温、パントリーごとに確認します" />
      <View style={styles.wrap}>
        {locations.map((location) => {
          const items = stockItems.filter((item) => item.location === location);
          return (
            <View key={location}>
              <SectionTitle title={`${location}（${items.length}件）`} />
              {items.length === 0 ? <EmptyState title="登録なし" message={`${location}には食品がありません。`} /> : items.map((item) => (
                <View key={item.id} style={styles.item}><StockItemCard item={item} /></View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  wrap: { paddingHorizontal: 20, gap: 6 },
  item: { marginBottom: 10 }
});
