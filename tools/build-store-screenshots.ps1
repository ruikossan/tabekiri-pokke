Add-Type -AssemblyName System.Drawing

$sourceDir = Join-Path (Get-Location) "screenshot"
$outputDir = Join-Path $sourceDir "styled"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$items = @(
  @{ File = "ホーム.png"; Title = "冷蔵庫の中身を`nひと目で確認"; Footer = "食品数・期限・買い物予定をまとめてチェック" },
  @{ File = "食品ストック.png"; Title = "保管場所ごとに`nすっきり整理"; Footer = "冷蔵庫・冷凍庫・常温ストックを迷わず管理" },
  @{ File = "食品登録.png"; Title = "期限も写真も`nかんたん登録"; Footer = "バーコードや写真で食品情報を残せる" },
  @{ File = "期限チェック.png"; Title = "期限が近い食品を`n見逃さない"; Footer = "期限切れ・間近の食品をまとめて確認" },
  @{ File = "買い物リスト.png"; Title = "買い忘れを減らす`n買い物メモ"; Footer = "不足分と手動追加をひとつのリストに" },
  @{ File = "よく買うもの.png"; Title = "いつもの食品を`nすばやく追加"; Footer = "よく買うものから1タップで買い物リストへ" },
  @{ File = "消費プラン.png"; Title = "あるもので考える`n消費プラン"; Footer = "期限が近い食品から食べきりをサポート" }
)

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-CenteredString($graphics, [string]$text, $font, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$lineHeight) {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Near
  $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip
  $lines = $text -split "`n"
  $totalHeight = $lines.Count * $lineHeight
  $currentY = $y + (($h - $totalHeight) / 2)
  foreach ($line in $lines) {
    $rect = New-Object System.Drawing.RectangleF($x, $currentY, $w, $lineHeight)
    $graphics.DrawString($line, $font, $brush, $rect, $format)
    $currentY += $lineHeight
  }
}

foreach ($item in $items) {
  $sourcePath = Join-Path $sourceDir $item.File
  if (-not (Test-Path -LiteralPath $sourcePath)) { continue }

  $canvas = New-Object System.Drawing.Bitmap 1290, 2796
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, 1290, 2796)),
    [System.Drawing.Color]::FromArgb(247, 252, 255),
    [System.Drawing.Color]::FromArgb(236, 253, 245),
    90
  )
  $graphics.FillRectangle($background, 0, 0, 1290, 2796)

  $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(52, 14, 165, 233)), 2
  for ($x = 0; $x -le 1290; $x += 54) { $graphics.DrawLine($gridPen, $x, 0, $x, 2796) }
  for ($y = 0; $y -le 2796; $y += 54) { $graphics.DrawLine($gridPen, 0, $y, 1290, $y) }

  $titleFont = New-Object System.Drawing.Font("Yu Gothic UI", 86, [System.Drawing.FontStyle]::Bold)
  $footerFont = New-Object System.Drawing.Font("Yu Gothic UI", 38, [System.Drawing.FontStyle]::Bold)
  $titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(79, 48, 36))
  Draw-CenteredString $graphics $item.Title $titleFont $titleBrush 78 84 1134 300 108

  $phoneShadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45, 23, 65, 81))
  $phoneFrameBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(18, 27, 31))
  $screenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

  $phoneX = 177
  $phoneY = 420
  $phoneW = 936
  $phoneH = 2028
  $frame = 34

  $shadowPath = New-RoundedRectPath ($phoneX + 22) ($phoneY + 28) $phoneW $phoneH 106
  $graphics.FillPath($phoneShadow, $shadowPath)
  $phonePath = New-RoundedRectPath $phoneX $phoneY $phoneW $phoneH 106
  $graphics.FillPath($phoneFrameBrush, $phonePath)

  $screenPath = New-RoundedRectPath ($phoneX + $frame) ($phoneY + $frame) ($phoneW - ($frame * 2)) ($phoneH - ($frame * 2)) 76
  $graphics.FillPath($screenBrush, $screenPath)

  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $destRect = New-Object System.Drawing.Rectangle ($phoneX + $frame), ($phoneY + $frame), ($phoneW - ($frame * 2)), ($phoneH - ($frame * 2))
  $state = $graphics.Save()
  $graphics.SetClip($screenPath)
  $graphics.DrawImage($source, $destRect)
  $graphics.Restore($state)

  $speakerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
  $speakerPath = New-RoundedRectPath 548 455 194 54 27
  $graphics.FillPath($speakerBrush, $speakerPath)

  $footerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(232, 20, 148, 158))
  $graphics.FillRectangle($footerBrush, 0, 2442, 1290, 354)

  $waveBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 20, 148, 158))
  $wavePath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $wavePath.StartFigure()
  $wavePath.AddBezier(-20, 2458, 300, 2356, 690, 2518, 1310, 2392)
  $wavePath.AddLine(1310, 2796, -20, 2796)
  $wavePath.CloseFigure()
  $graphics.FillPath($waveBrush, $wavePath)

  $footerTextBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  Draw-CenteredString $graphics $item.Footer $footerFont $footerTextBrush 72 2574 1146 90 54

  $outputPath = Join-Path $outputDir $item.File
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $source.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
}
