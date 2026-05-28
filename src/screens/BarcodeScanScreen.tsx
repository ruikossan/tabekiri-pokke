import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { RootStackParamList, ShoppingTemplate } from "../types";
import { useAppData } from "../services/AppDataContext";
import { addStockFromFavorite, calculateExpiryDate, findFavoriteByBarcode } from "../utils/favoriteItemUtils";

type Props = NativeStackScreenProps<RootStackParamList, "BarcodeScan">;

export function BarcodeScanScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [matchedFavorite, setMatchedFavorite] = useState<ShoppingTemplate | undefined>(undefined);
  const { shoppingTemplates, addStockItem, addStockHistoryItem, showToast } = useAppData();

  function handleScanned(result: BarcodeScanningResult): void {
    const barcode = result.data.trim();
    if (!barcode || scannedBarcode) return;

    setScannedBarcode(barcode);
    setMatchedFavorite(findFavoriteByBarcode(shoppingTemplates, barcode));
  }

  function resetScan(): void {
    setScannedBarcode("");
    setMatchedFavorite(undefined);
  }

  function addMatchedFavorite(): void {
    if (!matchedFavorite) return;
    const item = addStockFromFavorite(matchedFavorite);
    addStockItem(item)
      .then(async () => {
        await addStockHistoryItem({
          id: `history-${Date.now()}`,
          type: "購入",
          stockItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          createdAt: new Date().toISOString()
        });
        showToast(`${item.name}を食品ストックに追加しました`);
        navigation.goBack();
      })
      .catch(() => Alert.alert("保存エラー", "食品ストックに追加できませんでした。"));
  }

  function editWithBarcode(): void {
    navigation.replace("StockForm", matchedFavorite ? {
      itemId: route.params?.itemId,
      name: matchedFavorite.name,
      quantity: matchedFavorite.quantity,
      unit: matchedFavorite.unit,
      category: matchedFavorite.category,
      location: matchedFavorite.location,
      defaultExpiryDays: matchedFavorite.defaultExpiryDays,
      expiryDate: matchedFavorite.defaultExpiryDays !== undefined ? calculateExpiryDate(matchedFavorite.defaultExpiryDays) : undefined,
      barcode: scannedBarcode,
      saveToFavoriteDefault: false
    } : {
      itemId: route.params?.itemId,
      barcode: scannedBarcode,
      saveToFavoriteDefault: true
    });
  }

  if (!permission) {
    return <View style={styles.center}><Text style={styles.text}>カメラ権限を確認しています。</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>カメラの使用が許可されていません。</Text>
        <Text style={styles.text}>設定からカメラ権限を許可してください。許可しない場合も、食品登録画面でバーコード番号を手入力できます。</Text>
        <PrimaryButton title="カメラを許可する" onPress={() => void requestPermission()} />
        <PrimaryButton title="手入力する" variant="soft" onPress={() => navigation.replace("StockForm", { itemId: route.params?.itemId })} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {!scannedBarcode ? (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleScanned}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "itf14", "qr"] }}
        />
      ) : null}
      <View style={styles.overlay}>
        {!scannedBarcode ? (
          <>
            <Text style={styles.overlayTitle}>バーコードで追加</Text>
            <Text style={styles.overlayText}>バーコードを枠の中に入れてください。</Text>
          </>
        ) : matchedFavorite ? (
          <>
            <Text style={styles.overlayTitle}>登録済みの商品です</Text>
            <Text style={styles.name}>{matchedFavorite.name}</Text>
            <Text style={styles.overlayText}>{matchedFavorite.quantity}{matchedFavorite.unit} / {matchedFavorite.category ?? "カテゴリ未設定"} / {matchedFavorite.location ?? "保管場所未設定"}</Text>
            <Text style={styles.overlayText}>賞味期限：{matchedFavorite.defaultExpiryDays !== undefined ? calculateExpiryDate(matchedFavorite.defaultExpiryDays) : "未設定"}</Text>
            <PrimaryButton title="食品ストックに追加" onPress={addMatchedFavorite} />
            <PrimaryButton title="内容を編集して追加" variant="soft" onPress={editWithBarcode} />
            <PrimaryButton title="キャンセル" variant="soft" onPress={resetScan} />
          </>
        ) : (
          <>
            <Text style={styles.overlayTitle}>未登録の商品です</Text>
            <Text style={styles.overlayText}>バーコード：{scannedBarcode}</Text>
            <PrimaryButton title="商品情報を入力する" onPress={editWithBarcode} />
            <PrimaryButton title="キャンセル" variant="soft" onPress={resetScan} />
          </>
        )}
      </View>
      {scannedBarcode ? <Pressable style={styles.dim} onPress={resetScan} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.textMain },
  camera: { flex: 1 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  title: { color: colors.textMain, fontSize: 22, fontWeight: "800", textAlign: "center" },
  text: { color: colors.textSub, fontSize: 15, textAlign: "center", lineHeight: 22 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  overlay: { position: "absolute", left: 20, right: 20, bottom: 28, backgroundColor: colors.card, borderRadius: 8, padding: 16, gap: 10, zIndex: 2 },
  overlayTitle: { color: colors.textMain, fontSize: 18, fontWeight: "900" },
  name: { color: colors.textMain, fontSize: 19, fontWeight: "900" },
  overlayText: { color: colors.textSub, fontSize: 14, lineHeight: 20 }
});
