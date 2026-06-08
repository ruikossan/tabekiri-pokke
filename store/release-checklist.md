# たべきりポッケ リリースチェックリスト

## アプリ設定

- アプリ名: たべきりポッケ
- slug: tabekiri-pokke
- バージョン: 1.2.0
- iOS Bundle ID: com.tabekiripokke.app
- Android package: com.tabekiripokke.app
- iOS Build Number: 22
- Android Version Code: 1
- 暗号化: 独自の非免除暗号化は使用しない
- 広告: Google AdMob を使用する（現行コードではiOSのみ広告表示）

## 公開URL

App Store Connect には次のURLを入力します。

- Webサイト: https://ruikossan.github.io/tabekiri-pokke/index.html
- サポートURL: https://ruikossan.github.io/tabekiri-pokke/support.html
- プライバシーポリシーURL: https://ruikossan.github.io/tabekiri-pokke/privacy.html
- 利用規約URL: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- app-ads.txt: https://ruikossan.github.io/app-ads.txt

## ストア入力素材

- App Store Connect入力文面: `store/app-store-metadata.md`
- プライバシーポリシー原稿: `store/privacy-policy.md`
- サポート原稿: `store/support.md`
- スクリーンショット指示: `store/screenshots.md`
- スクリーンショット画像: `store/promo-real/`
- App内課金プロモーション画像: `screenshot/iap-promo-1024/`
- アイコン: `assets/icon.png`
- スプラッシュ画像: `assets/splash.png`

## リリース前確認

1. `npm.cmd run typecheck` が成功することを確認する。
2. 実機で食品登録、編集、削除、期限チェック、買い物リスト、通知設定、バーコード読み取り、写真登録を確認する。
3. GitHub Pages で公開URLが開けることを確認する。AdMob再審査前は `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-admob-readiness.ps1` を実行し、公開 `app-ads.txt` と公開プライバシーポリシーが最新内容になっていることを確認する。
4. App Store Connect の説明文またはEULA欄に Apple標準EULA のURLを入力する。
5. App内課金プロモーション画像は `screenshot/iap-promo-1024/` の専用画像を使い、アプリ画面スクリーンショットを使わない。画像内とPromoted In-App Purchaseの表示名・説明には価格を書かない。
6. App Store Connect の「契約／税金／口座情報」で Paid Apps Agreement が有効になっていることを確認する。
7. App Store Connect の自動更新サブスクリプション商品IDがコード側の `tabekiri_premium_monthly` と完全一致していることを確認する。
8. App Store Connect の自動更新サブスクリプション価格が日本ストアで月額200円になっていることを確認する。実機確認時はテスト用Apple IDの国/地域も日本にする。
9. App Store Connect で自動更新サブスクリプションを今回提出するアプリバージョンの「アプリ内課金」に紐づける。
10. Apple Developer で Bundle ID `com.tabekiripokke.app` を作成する。
11. App Store Connect で新規アプリを作成し、`store/app-store-metadata.md` の内容を入力する。
12. EAS にログイン済みであることを確認する。
13. App Store Connect の App Privacy を、Google Mobile Ads SDKの公式データ開示と `store/app-store-metadata.md` の回答案に合わせて更新する。
14. AdMob の「プライバシーとメッセージ」で、配信地域に応じて必要な同意メッセージを作成・公開する。
15. AdMob の app-ads.txt に表示される販売者情報が `https://ruikossan.github.io/app-ads.txt` と一致することを確認する。AdMobはストアのDeveloper Websiteのホスト名直下を確認するため、`/tabekiri-pokke/app-ads.txt` だけでは不十分。HTTP/HTTPSの両方で到達でき、`robots.txt` でクロールが拒否されていないことも確認する。
16. AdMob のアプリ設定で、App Store公開後のストアIDまたはアプリ名・Bundle ID `com.tabekiripokke.app` が正しくリンクされていることを確認する。
17. AdMob のアカウント確認、支払い情報、販売者情報、ポリシーセンターの未対応項目がないことを確認する。
18. iOS広告計測のため、`app.json` の `ios.infoPlist.SKAdNetworkItems` がGoogle公式のAdMob iOSセットアップに掲載されている最新IDと一致することを確認する。
19. 動画撮影・録音機能はないため、`expo-camera` の `microphonePermission` と `recordAudioAndroid` が `false` で、不要なマイク権限・説明文がネイティブ設定に入っていないことを確認する。
20. Google PlayにAndroid版を出す場合は、Play Consoleで「広告を含む」を申告し、データセーフティも広告SDK導入後の内容に更新する。Androidで広告収益化する場合は、別途Android用AdMob App IDと広告ユニットIDを作成してコードへ追加する。

## EAS Build / Submit

```bash
npm.cmd exec --package eas-cli -- eas login
npm.cmd exec --package eas-cli -- eas build --platform ios --profile production
npm.cmd exec --package eas-cli -- eas submit --platform ios --profile production
```

Androidも同時に準備する場合:

```bash
npm.cmd exec --package eas-cli -- eas build --platform android --profile production
npm.cmd exec --package eas-cli -- eas submit --platform android --profile production
```

## 注意

- `eas.json` は `production.autoIncrement` が有効です。ストアに再提出するたびに開発者向けビルド番号が重複しないよう、EASの表示も確認してください。
- `.env`、秘密鍵、Apple/Googleの認証情報はこのリポジトリに保存しないでください。
