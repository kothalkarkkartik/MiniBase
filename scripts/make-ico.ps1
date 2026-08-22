Add-Type -AssemblyName System.Drawing

$pngPath = "d:\MiniBase\minibase-logo.png"
$icoPath = "d:\MiniBase\app.ico"

$bmp = [System.Drawing.Bitmap]::FromFile($pngPath)
$thumb = New-Object System.Drawing.Bitmap $bmp, 256, 256
$hIcon = $thumb.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$fs = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$thumb.Dispose()
$bmp.Dispose()

Write-Host "✅ app.ico successfully generated!"
