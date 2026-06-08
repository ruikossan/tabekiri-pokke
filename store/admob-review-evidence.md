# たべきりポッケ AdMob再審査 証跡

確認日: 2026年6月8日

## コード/公開ページ側の確認結果

次のコマンドで確認済みです。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-admob-readiness.ps1
```

実行結果は全項目 `OK` です。

```text
iOS AdMob App ID: OK
Unused microphone permission: OK
SKAdNetworkItems count: OK
Google SKAdNetwork ID: OK
Local docs app-ads.txt: OK
Local privacy AdMob disclosure: OK
Store App Privacy metadata: OK
Public developer website: OK
Public app-ads.txt HTTPS: OK
Public app-ads.txt content type: OK
Public app-ads.txt HTTP: OK
Public robots.txt crawl access: OK
Public privacy URL: OK
```

## 公開URL

```text
Developer Website:
https://ruikossan.github.io/tabekiri-pokke/index.html

Privacy Policy:
https://ruikossan.github.io/tabekiri-pokke/privacy.html

app-ads.txt:
https://ruikossan.github.io/app-ads.txt
```

## app-ads.txt

公開中の `app-ads.txt` は次の1行です。

```text
google.com, pub-4658426326063416, DIRECT, f08c47fec0942fa0
```

HTTP/HTTPSの両方で取得でき、Content-Type は `text/plain; charset=utf-8` です。`robots.txt` は存在せず、クロール拒否はありません。

## AdMob / iOS設定

```text
Publisher ID: pub-4658426326063416
iOS AdMob App ID: ca-app-pub-4658426326063416~9486369129
iOS Bundle ID: com.tabekiripokke.app
Food registration interstitial: ca-app-pub-4658426326063416/8009939848
Expiry action interstitial: ca-app-pub-4658426326063416/5605313957
Continuous scan rewarded: ca-app-pub-4658426326063416/8720082362
```

iOS `Info.plist` にはAdMob用の `GADApplicationIdentifier` と `SKAdNetworkItems` が入ります。動画撮影・録音機能はないため、不要なマイク権限は無効化済みです。

## プライバシー/データ開示

プライバシーポリシーには Google AdMob / Google Mobile Ads SDK による広告配信、広告効果測定、不正防止、SDK改善のためのデータ利用を記載済みです。

App Store Connectの App Privacy は、`store/app-store-metadata.md` の回答案に沿って、Google Mobile Ads SDKのデータ開示を含めて更新します。

## AdMob管理画面で未確認の外部項目

次はAdMob管理画面でのみ確認できます。

```text
AdMobアプリ審査ステータス:
App Storeリンク:
app-ads.txt検出ステータス:
広告ユニットの所属アプリ:
ポリシーセンター未対応:
支払い情報:
本人確認:
販売者情報:
プライバシーとメッセージ:
```

これらは `store/admob-console-checklist.md` に沿って確認します。

