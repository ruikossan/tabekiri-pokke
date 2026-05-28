Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $root "screenshot"
$configPath = Join-Path $root "store\promo-real-config.json"
$outputDir = Join-Path $root "store\promo-real"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$items = Get-Content -LiteralPath $configPath -Encoding UTF8 | ConvertFrom-Json

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

function Draw-CenteredText($graphics, [string]$text, $font, $brush, [float]$x, [float]$y, [float]$w, [float]$h) {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $graphics.DrawString($text, $font, $brush, $rect, $format)
}

function Draw-Badge($graphics, [string]$text, [float]$x, [float]$y, [float]$w, [float]$h) {
  $path = New-RoundedRectPath $x $y $w $h 32
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235, 227, 249, 255))
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(160, 84, 178, 226)), 2
  $graphics.FillPath($brush, $path)
  $graphics.DrawPath($pen, $path)
  $font = New-Object System.Drawing.Font("Yu Gothic UI", 30, [System.Drawing.FontStyle]::Bold)
  $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 14, 78, 105))
  Draw-CenteredText $graphics $text $font $textBrush $x $y $w $h
  $font.Dispose()
  $textBrush.Dispose()
  $pen.Dispose()
  $brush.Dispose()
  $path.Dispose()
}

foreach ($item in $items) {
  $sourcePath = Join-Path $sourceDir $item.source
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    Write-Warning "Missing source screenshot: $sourcePath"
    continue
  }

  $canvas = New-Object System.Drawing.Bitmap 1290, 2796
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, 1290, 2796)
  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    [System.Drawing.Color]::FromArgb(255, 247, 252, 255),
    [System.Drawing.Color]::FromArgb(255, 232, 250, 247),
    90
  )
  $graphics.FillRectangle($background, $backgroundRect)

  $circleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(36, 14, 165, 233))
  $graphics.FillEllipse($circleBrush, -180, 120, 520, 520)
  $graphics.FillEllipse($circleBrush, 990, 2040, 420, 420)

  $titleFont = New-Object System.Drawing.Font("Yu Gothic UI", 70, [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font("Yu Gothic UI", 38, [System.Drawing.FontStyle]::Bold)
  $brandFont = New-Object System.Drawing.Font("Yu Gothic UI", 34, [System.Drawing.FontStyle]::Bold)
  $titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 23, 62, 78))
  $subtitleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 88, 118, 130))

  Draw-CenteredText $graphics $item.brand $brandFont $subtitleBrush 96 64 1098 64
  Draw-Badge $graphics $item.badge 482 150 326 70
  Draw-CenteredText $graphics $item.title $titleFont $titleBrush 90 246 1110 174
  Draw-CenteredText $graphics $item.subtitle $subtitleFont $subtitleBrush 120 424 1050 70

  $phoneX = 194
  $phoneY = 565
  $phoneW = 902
  $phoneH = 1952
  $frame = 32

  $shadowPath = New-RoundedRectPath ($phoneX + 28) ($phoneY + 32) $phoneW $phoneH 110
  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(48, 23, 62, 78))
  $graphics.FillPath($shadowBrush, $shadowPath)

  $phonePath = New-RoundedRectPath $phoneX $phoneY $phoneW $phoneH 110
  $frameBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 27, 31))
  $graphics.FillPath($frameBrush, $phonePath)

  $screenPath = New-RoundedRectPath ($phoneX + $frame) ($phoneY + $frame) ($phoneW - ($frame * 2)) ($phoneH - ($frame * 2)) 78
  $screenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $graphics.FillPath($screenBrush, $screenPath)

  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $screenX = $phoneX + $frame
  $screenY = $phoneY + $frame
  $screenW = $phoneW - ($frame * 2)
  $screenH = $phoneH - ($frame * 2)
  $sourceRatio = $source.Width / $source.Height
  $destRatio = $screenW / $screenH
  if ($sourceRatio -gt $destRatio) {
    $drawW = $screenW
    $drawH = [int]($screenW / $sourceRatio)
    $drawX = $screenX
    $drawY = $screenY + [int](($screenH - $drawH) / 2)
  } else {
    $drawH = $screenH
    $drawW = [int]($screenH * $sourceRatio)
    $drawX = $screenX + [int](($screenW - $drawW) / 2)
    $drawY = $screenY
  }
  $destRect = New-Object System.Drawing.Rectangle $drawX, $drawY, $drawW, $drawH
  $state = $graphics.Save()
  $graphics.SetClip($screenPath)
  $graphics.DrawImage($source, $destRect)
  $graphics.Restore($state)

  $speakerPath = New-RoundedRectPath 548 608 194 50 25
  $speakerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 3, 8, 12))
  $graphics.FillPath($speakerBrush, $speakerPath)

  $footerFont = New-Object System.Drawing.Font("Yu Gothic UI", 36, [System.Drawing.FontStyle]::Bold)
  $footerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 14, 78, 105))
  Draw-CenteredText $graphics $item.footer $footerFont $footerBrush 90 2594 1110 70

  $outputPath = Join-Path $outputDir $item.output
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $footerFont.Dispose()
  $footerBrush.Dispose()
  $speakerBrush.Dispose()
  $speakerPath.Dispose()
  $source.Dispose()
  $screenBrush.Dispose()
  $screenPath.Dispose()
  $frameBrush.Dispose()
  $phonePath.Dispose()
  $shadowBrush.Dispose()
  $shadowPath.Dispose()
  $brandFont.Dispose()
  $subtitleFont.Dispose()
  $titleFont.Dispose()
  $titleBrush.Dispose()
  $subtitleBrush.Dispose()
  $circleBrush.Dispose()
  $background.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
}
