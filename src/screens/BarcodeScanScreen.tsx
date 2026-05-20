import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CameraView, BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../constants/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "BarcodeScan">;

export function BarcodeScanScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function handleScanned(result: BarcodeScanningResult): void {
    if (scanned) return;
    const barcode = result.data.trim();
    if (!barcode) return;

    setScanned(true);
    navigation.replace("StockForm", { itemId: route.params?.itemId, scannedBarcode: barcode });
  }

  if (!permission) {
    return <View style={styles.center}><Text style={styles.text}>カメラ権限を確認しています</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>カメラの許可が必要です</Text>
        <Text style={styles.text}>
          食品のバーコードを読み取るときだけカメラを使います。撮影や録画は保存されず、読み取った番号だけを食品登録に利用します。
        </Text>
        <Text style={styles.note}>許可しなくても、食品名を手入力して登録できます。</Text>
        <PrimaryButton title="カメラを許可する" onPress={() => void requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScanned}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "itf14", "qr"] }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>バーコードを枠の中に入れてください</Text>
        <Text style={styles.overlayText}>バーコード番号を読み取り、登録済みの商品情報があれば再利用します。</Text>
        {scanned ? <PrimaryButton title="もう一度読み取る" onPress={() => setScanned(false)} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.textMain },
  camera: { flex: 1 },
  center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  title: { color: colors.textMain, fontSize: 22, fontWeight: "800", textAlign: "center" },
  text: { color: colors.textSub, fontSize: 15, textAlign: "center", lineHeight: 22 },
  note: { color: colors.textSub, fontSize: 13, textAlign: "center", lineHeight: 20 },
  overlay: { position: "absolute", left: 20, right: 20, bottom: 28, backgroundColor: colors.card, borderRadius: 8, padding: 16, gap: 8 },
  overlayTitle: { color: colors.textMain, fontSize: 17, fontWeight: "800" },
  overlayText: { color: colors.textSub, fontSize: 14, lineHeight: 20 }
});
