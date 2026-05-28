# たべきりポッケ リリースチェックリスト

## アプリ設定

- アプリ名: たべきりポッケ
- slug: tabekiri-pokke
- バージョン: 1.2.0
- iOS Bundle ID: com.tabekiripokke.app
- Android package: com.tabekiripokke.app
- iOS Build Number: 1
- Android Version Code: 1
- 暗号化: 独自の非免除暗号化は使用しない

## 公開URL

App Store Connect には次のURLを入力します。

- Webサイト: https://ruikossan.github.io/tabekiri-pokke/index.html
- サポートURL: https://ruikossan.github.io/tabekiri-pokke/support.html
- プライバシーポリシーURL: https://ruikossan.github.io/tabekiri-pokke/privacy.html

## ストア入力素材

- App Store Connect入力文面: `store/app-store-metadata.md`
- プライバシーポリシー原稿: `store/privacy-policy.md`
- サポート原稿: `store/support.md`
- スクリーンショット指示: `store/screenshots.md`
- スクリーンショット画像: `store/promo-real/`
- アイコン: `assets/icon.png`
- スプラッシュ画像: `assets/splash.png`

## リリース前確認

1. `npm.cmd run typecheck` が成功することを確認する。
2. 実機で食品登録、編集、削除、期限チェック、買い物リスト、通知設定、バーコード読み取り、写真登録を確認する。
3. GitHub Pages で公開URLが開けることを確認する。
4. Apple Developer で Bundle ID `com.tabekiripokke.app` を作成する。
5. App Store Connect で新規アプリを作成し、`store/app-store-metadata.md` の内容を入力する。
6. EAS にログイン済みであることを確認する。

## EAS Build / Submit

```bash
eas login
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Androidも同時に準備する場合:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

## 注意

- `eas.json` は `production.autoIncrement` が有効です。ストアに再提出するたびに開発者向けビルド番号が重複しないよう、EASの表示も確認してください。
- `.env`、秘密鍵、Apple/Googleの認証情報はこのリポジトリに保存しないでください。
