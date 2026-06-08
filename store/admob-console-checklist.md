# たべきりポッケ AdMob管理画面チェックリスト

最終更新日: 2026年6月8日

このチェックリストは、リポジトリ側で修正済みのAdMob承認データを、AdMob管理画面とApp Store Connect側で収益化可能な状態へ進めるための確認表です。

## 事前確認

ローカルで次を実行し、すべて `OK` になることを確認します。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-admob-readiness.ps1
```

## AdMob アプリ審査

1. AdMobにログインする。
2. 左メニューの「アプリ」から「すべてのアプリを表示」を開く。
3. `たべきりポッケ` または iOS App ID `ca-app-pub-4658426326063416~9486369129` を探す。
4. アプリの審査ステータスを確認する。
5. `Requires review` の場合は、App Store公開情報とストアリンクを確認してから再審査を進める。
6. `Getting ready` の場合は、アプリ審査中です。支払い情報が未完了だとこの状態が続く場合があるため、支払い設定も確認する。
7. `Needs attention` または不承認表示がある場合は、表示された理由をそのまま `store/admob-readiness-check.md` に追記してから対応する。

## App Storeリンク

1. AdMobのアプリ設定を開く。
2. 対象アプリが iOS アプリとして作成されていることを確認する。
3. Bundle ID が `com.tabekiripokke.app` であることを確認する。
4. App Store公開後のストアID、またはApp Storeのアプリページに正しくリンクされていることを確認する。
5. App Store ConnectのデベロッパーWebサイトURLが `https://ruikossan.github.io/tabekiri-pokke/index.html` になっていることを確認する。
6. プライバシーポリシーURLが `https://ruikossan.github.io/tabekiri-pokke/privacy.html` になっていることを確認する。

## app-ads.txt

1. AdMobの app-ads.txt ステータスを開く。
2. `pub-4658426326063416` が検出済みになっていることを確認する。
3. `https://ruikossan.github.io/app-ads.txt` の内容が次の1行であることを確認する。

```text
google.com, pub-4658426326063416, DIRECT, f08c47fec0942fa0
```

4. AdMob側で未検出の場合、Googleのクロール反映に数日かかる場合があるため、日時と表示内容を記録して再確認する。

## 広告ユニット

1. iOSアプリ `たべきりポッケ` に次の広告ユニットが属していることを確認する。
2. 食品登録インタースティシャル: `ca-app-pub-4658426326063416/8009939848`
3. 期限チェックインタースティシャル: `ca-app-pub-4658426326063416/5605313957`
4. 連続スキャンリワード: `ca-app-pub-4658426326063416/8720082362`
5. 広告ユニットが別アプリに紐づいている場合は、AdMob側で正しいiOSアプリ配下に作り直し、コード側のIDも更新する。

## プライバシーと同意

1. AdMobの「プライバシーとメッセージ」を開く。
2. 配信対象地域に応じて、必要な同意メッセージが公開済みであることを確認する。
3. Google Mobile Ads SDKのデータ利用を、App Store Connectの App Privacy と `store/app-store-metadata.md` の回答案に合わせる。
4. IDFAを使うパーソナライズ広告やトラッキング目的の利用を有効化する場合は、ATT説明文と許可導線をアプリ側へ追加してからApp Privacyを更新する。

## アカウントと支払い

1. AdMobの「お支払い」を開く。
2. 支払い情報が設定済みであることを確認する。
3. 本人確認が要求されている場合は、期限内に提出する。
4. 住所確認PINが要求されている場合は、PIN受領後に入力する。
5. 販売者情報と sellers.json の公開設定を確認する。
6. 支払い保留、本人確認待ち、ポリシーセンターの未対応項目がないことを確認する。

## 再審査前の証跡

再審査前に、次の値を記録します。

現在のコード/公開ページ側の確認結果は `store/admob-review-evidence.md` にまとめています。

```text
確認日:
AdMobアプリ審査ステータス:
app-ads.txtステータス:
ポリシーセンター未対応:
支払い情報:
本人確認:
販売者情報:
App Storeリンク:
App Privacy更新:
実行したreadinessチェック結果:
```

## 再審査・問い合わせ用メモ

AdMobのポリシーセンター、問い合わせ、または社内確認で説明が必要な場合は、次の内容を状況に合わせて使用します。

```text
たべきりポッケ（iOS / Bundle ID: com.tabekiripokke.app）のAdMob承認準備として、以下を確認済みです。

- iOS AdMob App ID: ca-app-pub-4658426326063416~9486369129
- Publisher ID: pub-4658426326063416
- app-ads.txt: https://ruikossan.github.io/app-ads.txt
- app-ads.txt内容: google.com, pub-4658426326063416, DIRECT, f08c47fec0942fa0
- デベロッパーWebサイト: https://ruikossan.github.io/tabekiri-pokke/index.html
- プライバシーポリシー: https://ruikossan.github.io/tabekiri-pokke/privacy.html
- Google Mobile Ads SDKによるデータ収集をプライバシーポリシーとApp Store ConnectのApp Privacyに反映済み
- iOS Info.plistにAdMob用SKAdNetworkIdentifierを設定済み
- 動画撮影・録音機能はないため、不要なマイク権限は無効化済み
- 広告表示は無料プランのみで、プレミアムでは広告を表示しない設計
- 広告表示に失敗した場合は広告表示済みとして記録しない設計

readinessチェックは `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-admob-readiness.ps1` で全項目OKです。
```

不承認理由が表示されている場合は、次の形式で記録します。

```text
確認日:
AdMob画面:
表示ステータス:
不承認/警告の原文:
対象アプリID:
対象広告ユニットID:
対応したファイル:
対応後のreadinessチェック:
再審査/問い合わせ実施日:
```

## 不承認時の切り分け

| 表示/症状 | 優先確認 |
| --- | --- |
| app-ads.txtが未検出 | デベロッパーWebサイトURL、ホスト直下の `app-ads.txt`、HTTP/HTTPS到達性、robots.txt、数日待ち |
| Getting readyが長い | 支払い情報、本人確認、アカウント確認、App Storeリンク |
| Needs attention | AdMobポリシーセンターの表示理由、App Store公開情報、プライバシーポリシー |
| 広告配信が限定的 | アプリ審査ステータス、広告ユニットの所属アプリ、同意メッセージ、リクエスト設定 |
| App Privacy不一致 | Google Mobile Ads SDKのデータ開示、`store/app-store-metadata.md`、App Store Connect回答 |
