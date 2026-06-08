import { Alert } from "react-native";

export type RewardedAdPlacement = "foodRegistration" | "expiryAction" | "continuousScanBoost";

const placementMessages: Record<RewardedAdPlacement, string> = {
  foodRegistration: "食品登録が5件完了しました。無料プランでは5件ごとに動画広告を表示します。",
  expiryAction: "期限チェックの操作が完了しました。無料プランでは1日1回、動画広告を表示します。",
  continuousScanBoost: "動画広告を見ると、本日の連続スキャン回数を20回増やせます。"
};

export const adService = {
  showVideoAd(placement: RewardedAdPlacement): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert("動画広告", placementMessages[placement], [
        { text: "閉じる", onPress: () => resolve(true) }
      ]);
    });
  },
  showRewardedVideo(placement: RewardedAdPlacement): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert("動画広告", placementMessages[placement], [
        { text: "あとで", style: "cancel", onPress: () => resolve(false) },
        { text: "広告を見る", onPress: () => resolve(true) }
      ]);
    });
  }
};
