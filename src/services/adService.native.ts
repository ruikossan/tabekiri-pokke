import { Alert, Platform } from "react-native";
import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds
} from "react-native-google-mobile-ads";

export type RewardedAdPlacement = "foodRegistration" | "expiryAction" | "continuousScanBoost";

const interstitialUnitIds: Record<Exclude<RewardedAdPlacement, "continuousScanBoost">, string> = {
  foodRegistration: "ca-app-pub-4658426326063416/8009939848",
  expiryAction: "ca-app-pub-4658426326063416/5605313957"
};

const rewardedUnitIds: Record<Extract<RewardedAdPlacement, "continuousScanBoost">, string> = {
  continuousScanBoost: "ca-app-pub-4658426326063416/8720082362"
};

function getInterstitialUnitId(placement: Exclude<RewardedAdPlacement, "continuousScanBoost">): string {
  return __DEV__ ? TestIds.INTERSTITIAL : interstitialUnitIds[placement];
}

function getRewardedUnitId(placement: Extract<RewardedAdPlacement, "continuousScanBoost">): string {
  return __DEV__ ? TestIds.REWARDED : rewardedUnitIds[placement];
}

async function prepareAds(): Promise<boolean> {
  try {
    const consentInfo = await AdsConsent.gatherConsent({ tagForUnderAgeOfConsent: false });
    if (!consentInfo.canRequestAds) return false;
  } catch {
    return false;
  }

  await mobileAds().initialize();
  return true;
}

function showFallbackNotice(): Promise<void> {
  return new Promise((resolve) => {
    Alert.alert("広告", "この環境では広告を表示できません。", [
      { text: "閉じる", onPress: () => resolve() }
    ]);
  });
}

async function showInterstitialAd(placement: Exclude<RewardedAdPlacement, "continuousScanBoost">): Promise<void> {
  if (Platform.OS !== "ios") return Promise.resolve();
  if (!(await prepareAds())) return Promise.resolve();

  return new Promise((resolve) => {
    const ad = InterstitialAd.createForAdRequest(getInterstitialUnitId(placement));
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      resolve();
    };

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show().catch(finish);
    });
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, finish);

    ad.load();
  });
}

async function showRewardedAd(placement: Extract<RewardedAdPlacement, "continuousScanBoost">): Promise<boolean> {
  if (Platform.OS !== "ios") return Promise.resolve(false);
  if (!(await prepareAds())) return Promise.resolve(false);

  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(getRewardedUnitId(placement));
    let earnedReward = false;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      resolve(earnedReward);
    };

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      ad.show().catch(finish);
    });
    const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedReward = true;
    });
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, finish);

    ad.load();
  });
}

export const adService = {
  showVideoAd(placement: RewardedAdPlacement): Promise<void> {
    if (placement === "continuousScanBoost") return showFallbackNotice();
    return showInterstitialAd(placement);
  },
  showRewardedVideo(placement: RewardedAdPlacement): Promise<boolean> {
    if (placement !== "continuousScanBoost") {
      return showInterstitialAd(placement).then(() => true);
    }
    return showRewardedAd(placement);
  }
};
