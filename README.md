# たべきりポッケ

「たべきりポッケ」は、冷蔵庫・冷凍庫・食品ストックをまとめて管理し、賞味期限切れや買い忘れを減らすためのスマートフォンアプリです。

食品名、数量、保管場所、カテゴリ、期限、写真、バーコード番号を登録できます。登録した食品データは端末内に保存されるため、ログインなしで使えます。

## App Store Connect入力内容

提出時に使うメタデータ案は [store/app-store-metadata.md](store/app-store-metadata.md) に作成済みです。

現時点で記入済み:

- アプリ名
- サブタイトル
- プロモーション用テキスト
- 説明文
- キーワード
- カテゴリ案
- 年齢制限案
- App Privacyの回答案
- 審査メモ

GitHub Pagesで公開するページ:

- Webトップ: [docs/index.html](docs/index.html)
- サポートURL: [docs/support.html](docs/support.html)
- プライバシーポリシーURL: [docs/privacy.html](docs/privacy.html)

GitHub Pages公開URL:

```text
https://ruikossan.github.io/tabekiri-pokke/index.html
https://ruikossan.github.io/tabekiri-pokke/support.html
https://ruikossan.github.io/tabekiri-pokke/privacy.html
```

画像素材:

- アプリアイコン: [assets/icon.png](assets/icon.png)
- Android用アダプティブアイコン前景: [assets/adaptive-icon.png](assets/adaptive-icon.png)
- スプラッシュ画像: [assets/splash.png](assets/splash.png)
- スクリーンショット撮影指示: [store/screenshots.md](store/screenshots.md)

## 主な機能

- 食品の登録、編集、削除
- 食品名、数量、単位、カテゴリ、保管場所、期限、メモの管理
- 冷蔵庫、冷凍庫、常温、食品棚など保管場所別の一覧表示
- 期限切れ、7日以内、30日以内などの期限チェック
- 食品ごとの次回チェック日の管理
- 食品写真の登録
- バーコード読み取りによる番号保存
- 登録済みバーコード番号から食品情報を再利用
- 買い物リストの自動作成と手動追加
- よく買うものテンプレート
- 使った、買った、確認した履歴の表示
- 期限通知の予約
- 初回ガイド、使い方ガイド
- お試しデータの投入と初期状態へのリセット

## 現在の仕様

- データは端末内の `AsyncStorage` に保存します。
- ログイン機能、会員登録、クラウド同期はありません。
- 外部サーバーへ食品データを送信しません。
- 無料プランの一部機能では Google AdMob による広告を表示する場合があります。
- インターネットに接続していなくても基本機能を利用できます。
- 端末変更時のデータ移行やバックアップは未対応です。
- バーコード読み取り、食品写真、期限通知には端末権限の許可が必要です。

## iOSリリース設定

`app.json` で以下を設定済みです。

- アプリ表示名: `たべきりポッケ`
- slug: `tabekiri-pokke`
- iOS Bundle ID: `com.tabekiripokke.app`
- iPhone専用: `ios.supportsTablet` は `false`
- アプリバージョン: `1.2.0`
- iOS Build Number: `22`
- アプリアイコン: `./assets/icon.png`
- スプラッシュ画像: `./assets/splash.png`
- カメラ、写真ライブラリの権限説明

Bundle IDをApple Developerで別名にしたい場合は、`ios.bundleIdentifier` を同じ値に変更してください。

## 開発環境

必要なもの:

- Node.js
- npm
- iPhoneまたはAndroid端末
- Expo Go

依存関係のインストール:

```bash
npm install
```

PowerShellで失敗する場合:

```bash
npm.cmd install
```

開発サーバーの起動:

```bash
npm run start
```

型チェック:

```bash
npm run typecheck
```

## EAS Build

`eas.json` を作成済みです。

```bash
npm.cmd exec --package eas-cli -- eas login
npm.cmd exec --package eas-cli -- eas build --platform ios --profile production
npm.cmd exec --package eas-cli -- eas submit --platform ios --profile production
```

## 使用技術

- Expo SDK 54
- React Native
- TypeScript
- React Navigation
- AsyncStorage
- date-fns
- expo-camera
- expo-image-picker
- expo-notifications

## 注意事項

- 現在はMVP版です。
- データ移行、クラウド同期、複数端末共有は未対応です。
- サポートURLとプライバシーポリシーURLは、`docs/` をGitHub Pagesで公開したURLを入力してください。
- App Store提出前に実機でカメラ、写真、通知、食品登録、買い物リスト、リセット操作を確認してください。
