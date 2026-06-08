# たべきりポッケ AdMob承認チェック

最終更新日: 2026年6月8日

## 現在確認できた状態

- AdMob Publisher ID: `pub-4658426326063416`
- iOS AdMob App ID: `ca-app-pub-4658426326063416~9486369129`
- iOS Bundle ID: `com.tabekiripokke.app`
- iOS SKAdNetworkItems: Google公式のAdMob iOSセットアップに掲載されている `SKAdNetworkIdentifier` を `app.json` の `ios.infoPlist` に設定済み
- app-ads.txt公開URL: `https://ruikossan.github.io/app-ads.txt`
- app-ads.txt内容: `google.com, pub-4658426326063416, DIRECT, f08c47fec0942fa0`
- WebサイトURL: `https://ruikossan.github.io/tabekiri-pokke/index.html`
- プライバシーポリシーURL: `https://ruikossan.github.io/tabekiri-pokke/privacy.html`
- 現行コードの広告表示対象: iOSのみ

## コード側の承認対策

- 開発中はGoogleのテスト広告ID、本番ではAdMobの本番広告ユニットIDを使う。
- Google Mobile Ads SDK初期化前に、広告内容レーティングを `G`、児童向け/同意年齢未満タグを `false` として明示する。
- iOSの `Info.plist` に `SKAdNetworkItems` を設定し、IDFAが使えない場合でも広告キャンペーン計測に対応する。
- UMP同意取得で広告リクエスト不可の場合、本番では広告を表示しない。
- 無料プランのみ広告を表示し、プレミアムでは広告を出さない。
- 広告表示に失敗した場合は「広告表示済み」として記録せず、次回の自然な区切りで再試行する。
- たべきりポッケでは動画撮影・録音を使わないため、`expo-camera` の `microphonePermission` と `recordAudioAndroid` を `false` にし、不要なマイク権限・説明文が審査データに混ざらないようにする。

## AdMob管理画面で必ず確認すること

再審査前に、ローカルで次を実行して `OK` になることを確認します。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-admob-readiness.ps1
```

1. アプリがApp Storeで公開済み、または公開後のストア情報にリンクされている。
2. AdMobのアプリ設定に、App StoreのストアIDまたはBundle ID `com.tabekiripokke.app` が正しく紐づいている。
3. app-ads.txtステータスで `pub-4658426326063416` の行が確認済みになっている。
4. App Store Connect のデベロッパーWebサイトURLが `https://ruikossan.github.io/tabekiri-pokke/index.html` で、AdMobがホスト直下の `https://ruikossan.github.io/app-ads.txt` をクロールできる。
5. `app-ads.txt` がHTTPSとHTTPの両方で到達でき、HTTP 200相当でテキストとして返る。
6. `robots.txt` で `/app-ads.txt` またはサイト全体のクロールが拒否されていない。
7. ポリシーセンターの「Needs attention」や「Disapproved apps」に未対応項目がない。
8. アカウント確認、支払い情報、販売者情報が完了している。
9. 「プライバシーとメッセージ」で、配信地域に応じた同意メッセージを公開している。
10. iOSの広告ユニットIDが、AdMob上で同じiOSアプリに属している。
11. AdMobまたはGoogle公式ドキュメントでSKAdNetwork IDの更新が表示された場合は、`app.json` の `SKAdNetworkItems` を更新する。
12. App Store Connect の App Privacy が、Google Mobile Ads SDKの公式データ開示に合わせて、位置情報、識別子、使用状況データ、診断、広告データを確認済みになっている。

## Androidで広告収益化する場合

現行コードはAndroidでは広告を表示しません。Android版でも広告収益化する場合は、次を追加で行います。

- Android用AdMob App IDを作成し、`app.json` の `react-native-google-mobile-ads` 設定へ `androidAppId` を追加する。
- Android用の広告ユニットIDを作成し、`src/services/adService.native.ts` でPlatform別に切り替える。
- Google Play Consoleで「広告を含む」とデータセーフティを広告SDK導入後の内容で申告する。
