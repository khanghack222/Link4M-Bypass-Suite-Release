# Set UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 >$null 2>&1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path "$ScriptDir\..").Path
Set-Location $ProjectRoot

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  BIEN DICH BYPASS.PY SANG C EXTENSION (.PYD) BANG NUITKA" -ForegroundColor Yellow
Write-Host "=======================================================`n" -ForegroundColor Cyan

$pythonCmd = "python"
$candidates = @(
    "C:\Users\XUAN\AppData\Local\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:ProgramFiles\Python311\python.exe"
)
foreach ($c in $candidates) {
    if (Test-Path $c) { $pythonCmd = $c; break }
}

Write-Host "[*] Dang su dung Python: $pythonCmd" -ForegroundColor Gray
Write-Host "[*] Bat dau qua trinh bien dich ma may C..." -ForegroundColor Cyan

$distDir = "$ProjectRoot\build_dist"
if (Test-Path $distDir) { Remove-Item -Recurse -Force $distDir }
New-Item -ItemType Directory -Path $distDir | Out-Null

& $pythonCmd -m nuitka --module --assume-yes-for-downloads --output-dir="$distDir" "$ProjectRoot\src\core\bypass.py"

if ($LASTEXITCODE -eq 0) {
    $pydFile = Get-ChildItem -Path $distDir -Filter "*.pyd" | Select-Object -First 1
    if ($pydFile) {
        $finalTarget = "$ProjectRoot\src\core\bypass.pyd"
        Copy-Item -Path $pydFile.FullName -Destination $finalTarget -Force
        Copy-Item -Path $pydFile.FullName -Destination "$ProjectRoot\bypass.pyd" -Force

        Write-Host "`n[+] BIEN DICH THANH CONG!" -ForegroundColor Green
        Write-Host "  - File ma may C: $finalTarget" -ForegroundColor White
        Write-Host "  - Dung luong: $([math]::Round($pydFile.Length / 1KB, 2)) KB" -ForegroundColor Gray
        Write-Host "  - File nay khong chua code Python goc, co the up len GitHub Release an toan!" -ForegroundColor Yellow
    } else {
        Write-Host "[!] Khong tim thay file .pyd trong thu muc build." -ForegroundColor Red
    }
} else {
    Write-Host "[!] Qua trinh bien dich Nuitka gap loi." -ForegroundColor Red
}

Write-Host "`nNhan phim bat ky de dong..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
