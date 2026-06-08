Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$appJsonPath = Join-Path $projectRoot "app.json"
$privacyPath = Join-Path $projectRoot "docs\privacy.html"
$appAdsPath = Join-Path $projectRoot "docs\app-ads.txt"
$storeMetadataPath = Join-Path $projectRoot "store\app-store-metadata.md"

$expectedPublisherLine = "google.com, pub-4658426326063416, DIRECT, f08c47fec0942fa0"
$expectedIosAppId = "ca-app-pub-4658426326063416~9486369129"
$publicWebsiteUrl = "https://ruikossan.github.io/tabekiri-pokke/index.html"
$publicAppAdsUrl = "https://ruikossan.github.io/app-ads.txt"
$publicAppAdsHttpUrl = "http://ruikossan.github.io/app-ads.txt"
$publicPrivacyUrl = "https://ruikossan.github.io/tabekiri-pokke/privacy.html"
$publicRobotsUrl = "https://ruikossan.github.io/robots.txt"

function Add-Result {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )

  [PSCustomObject]@{
    Check = $Name
    Status = if ($Ok) { "OK" } else { "NG" }
    Detail = $Detail
  }
}

$results = New-Object System.Collections.Generic.List[object]

$appConfig = Get-Content -Encoding UTF8 -LiteralPath $appJsonPath | ConvertFrom-Json
$iosAppId = $appConfig.expo.plugins |
  Where-Object { $_ -is [array] -and $_[0] -eq "react-native-google-mobile-ads" } |
  ForEach-Object { $_[1].iosAppId } |
  Select-Object -First 1

$results.Add((Add-Result "iOS AdMob App ID" ($iosAppId -eq $expectedIosAppId) "app.json: $iosAppId"))

$cameraOptions = $appConfig.expo.plugins |
  Where-Object { $_ -is [array] -and $_[0] -eq "expo-camera" } |
  ForEach-Object { $_[1] } |
  Select-Object -First 1
$microphoneDisabled = $cameraOptions.microphonePermission -eq $false -and $cameraOptions.recordAudioAndroid -eq $false
$results.Add((Add-Result "Unused microphone permission" $microphoneDisabled "microphonePermission: $($cameraOptions.microphonePermission), recordAudioAndroid: $($cameraOptions.recordAudioAndroid)"))

$skAdNetworkItems = @($appConfig.expo.ios.infoPlist.SKAdNetworkItems)
$skAdNetworkIds = @($skAdNetworkItems | ForEach-Object { $_.SKAdNetworkIdentifier })
$uniqueSkAdNetworkIds = @($skAdNetworkIds | Sort-Object -Unique)
$results.Add((Add-Result "SKAdNetworkItems count" ($skAdNetworkIds.Count -ge 50 -and $skAdNetworkIds.Count -eq $uniqueSkAdNetworkIds.Count) "$($skAdNetworkIds.Count) ids, $($uniqueSkAdNetworkIds.Count) unique"))
$results.Add((Add-Result "Google SKAdNetwork ID" ($skAdNetworkIds -contains "cstr6suwn9.skadnetwork") "cstr6suwn9.skadnetwork"))

$localAppAds = (Get-Content -Encoding UTF8 -LiteralPath $appAdsPath -Raw).Trim()
$results.Add((Add-Result "Local docs app-ads.txt" ($localAppAds -eq $expectedPublisherLine) $localAppAds))

$localPrivacy = Get-Content -Encoding UTF8 -LiteralPath $privacyPath -Raw
$localPrivacyHasAdMob = $localPrivacy.Contains("Google AdMob")
$localPrivacyHasCrashLogs = $localPrivacy.Contains("crash-logs")
$localPrivacyHasVideoViews = $localPrivacy.Contains("video-views")
$privacyHasAdMob = $localPrivacyHasAdMob -and $localPrivacyHasCrashLogs -and $localPrivacyHasVideoViews
$results.Add((Add-Result "Local privacy AdMob disclosure" $privacyHasAdMob "Google AdMob: $localPrivacyHasAdMob, crash logs: $localPrivacyHasCrashLogs, video views: $localPrivacyHasVideoViews"))

$storeMetadata = Get-Content -Encoding UTF8 -LiteralPath $storeMetadataPath -Raw
$appPrivacyReady = $storeMetadata.Contains("admob-app-privacy: location identifiers usage-data diagnostics advertising-data")
$results.Add((Add-Result "Store App Privacy metadata" $appPrivacyReady "location/id/usage/diagnostics/ad data categories documented"))

try {
  $publicWebsite = Invoke-WebRequest -UseBasicParsing -Uri $publicWebsiteUrl
  $publicWebsiteBody = [string]$publicWebsite.Content
  $publicWebsiteReady = $publicWebsite.StatusCode -eq 200 -and $publicWebsiteBody.Contains("privacy.html")
  $results.Add((Add-Result "Public developer website" $publicWebsiteReady "HTTP $($publicWebsite.StatusCode), privacy link visible: $($publicWebsiteBody.Contains("privacy.html"))"))
} catch {
  $results.Add((Add-Result "Public developer website" $false $_.Exception.Message))
}

try {
  $publicAppAdsResponse = Invoke-WebRequest -UseBasicParsing -Uri $publicAppAdsUrl
  $publicAppAds = $publicAppAdsResponse.Content.Trim()
  $publicAppAdsContentType = $publicAppAdsResponse.Headers["Content-Type"]
  $publicAppAdsReady = $publicAppAdsResponse.StatusCode -eq 200 -and $publicAppAds -eq $expectedPublisherLine
  $results.Add((Add-Result "Public app-ads.txt HTTPS" $publicAppAdsReady "HTTP $($publicAppAdsResponse.StatusCode), $publicAppAds"))
  $results.Add((Add-Result "Public app-ads.txt content type" ($publicAppAdsContentType -match "text/plain|text/html|application/octet-stream") "$publicAppAdsContentType"))
} catch {
  $results.Add((Add-Result "Public app-ads.txt HTTPS" $false $_.Exception.Message))
  $results.Add((Add-Result "Public app-ads.txt content type" $false "not checked because HTTPS fetch failed"))
}

try {
  $publicAppAdsHttp = (Invoke-WebRequest -UseBasicParsing -Uri $publicAppAdsHttpUrl).Content.Trim()
  $results.Add((Add-Result "Public app-ads.txt HTTP" ($publicAppAdsHttp -eq $expectedPublisherLine) $publicAppAdsHttp))
} catch {
  $results.Add((Add-Result "Public app-ads.txt HTTP" $false $_.Exception.Message))
}

try {
  $publicRobots = Invoke-WebRequest -UseBasicParsing -Uri $publicRobotsUrl
  $robotsBody = [string]$publicRobots.Content
  $robotsAllowsAppAds = $publicRobots.StatusCode -eq 200 -and
    -not ($robotsBody -match "(?mi)^\s*Disallow:\s*/app-ads\.txt\s*$") -and
    -not ($robotsBody -match "(?mi)^\s*Disallow:\s*/\s*$")
  $results.Add((Add-Result "Public robots.txt crawl access" $robotsAllowsAppAds "HTTP $($publicRobots.StatusCode), app-ads disallowed: $(-not $robotsAllowsAppAds)"))
} catch {
  $response = $_.Exception.Response
  $statusCode = $null
  if ($null -ne $response -and $response.PSObject.Properties.Name -contains "StatusCode") {
    $statusCode = $response.StatusCode.value__
  }

  if ($statusCode -eq 404) {
    $results.Add((Add-Result "Public robots.txt crawl access" $true "robots.txt not found; no explicit crawl block"))
  } else {
    $results.Add((Add-Result "Public robots.txt crawl access" $false $_.Exception.Message))
  }
}

try {
  $publicPrivacy = Invoke-WebRequest -UseBasicParsing -Uri $publicPrivacyUrl
  $publishedPrivacyBody = [string]$publicPrivacy.Content
  $publicPrivacyReady = $publicPrivacy.StatusCode -eq 200 -and $publishedPrivacyBody.Contains("Google AdMob") -and $publishedPrivacyBody.Contains("crash-logs") -and $publishedPrivacyBody.Contains("video-views")
  $results.Add((Add-Result "Public privacy URL" $publicPrivacyReady "HTTP $($publicPrivacy.StatusCode), updated disclosure marker visible: $($publishedPrivacyBody.Contains("crash-logs"))"))
} catch {
  $results.Add((Add-Result "Public privacy URL" $false $_.Exception.Message))
}

$results | Format-Table -AutoSize

if ($results.Status -contains "NG") {
  exit 1
}

exit 0
