# たべきりポッケ リリースチェックリスト

## アプリ設定

- アプリ名: たべきりポッケ
- slug: tabekiri-pokke
- バージョン: 1.2.0
- iOS Bundle ID: com.tabekiripokke.app
- Android package: com.tabekiripokke.app
- iOS Build Number: 7
- Android Version Code: 1
- 暗号化: 独自の非免除暗号化は使用しない
- 広告: Google AdMob を使用する

## 公開URL

App Store Connect には次のURLを入力します。

- Webサイト: https://ruikossan.github.io/tabekiri-pokke/index.html
- サポートURL: https://ruikossan.github.io/tabekiri-pokke/support.html
- プライバシーポリシーURL: https://ruikossan.github.io/tabekiri-pokke/privacy.html
- 利用規約URL: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- app-ads.txt: https://ruikossan.github.io/app-ads.txt またはストアのデベロッパーWebサイトのドメイン直下に設置する

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
3. GitHub Pages で公開URLが開けることを確認する。
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
15. AdMob の app-ads.txt に表示される販売者情報が `docs/app-ads.txt` と一致することを確認する。
16. Google PlayにAndroid版を出す場合は、Play Consoleで「広告を含む」を申告し、データセーフティも広告SDK導入後の内容に更新する。

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
