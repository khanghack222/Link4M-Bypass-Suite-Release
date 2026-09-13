[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 >$null 2>&1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path "$ScriptDir\..").Path
$ReleaseDir = "$ProjectRoot\release_native"

if (Test-Path $ReleaseDir) { Remove-Item -Recurse -Force $ReleaseDir }
New-Item -ItemType Directory -Path "$ReleaseDir\src\core" -Force | Out-Null
New-Item -ItemType Directory -Path "$ReleaseDir\src\ui" -Force | Out-Null
New-Item -ItemType Directory -Path "$ReleaseDir\scripts" -Force | Out-Null

$pythonCmd = "C:\Users\XUAN\AppData\Local\Programs\Python\Python311\python.exe"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  BIEN DICH TOAN BO CORE PYTHON SANG NATIVE BINARY (.PYD)" -ForegroundColor Yellow
Write-Host "=======================================================`n" -ForegroundColor Cyan

$modules = @("config", "sponsor", "bypass")

foreach ($mod in $modules) {
    Write-Host "[*] Dang bien dich $mod.py sang $mod.pyd..." -ForegroundColor Cyan
    $buildDir = "$ProjectRoot\build_temp_$mod"
    if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir }
    
    & $pythonCmd -m nuitka --module --assume-yes-for-downloads --output-dir="$buildDir" "$ProjectRoot\src\core\$mod.py"
    
    $pyd = Get-ChildItem -Path $buildDir -Filter "*.pyd" | Select-Object -First 1
    if ($pyd) {
        Copy-Item -Path $pyd.FullName -Destination "$ReleaseDir\src\core\$mod.pyd" -Force
        Copy-Item -Path $pyd.FullName -Destination "$ReleaseDir\src\core\$($pyd.Name)" -Force
        Copy-Item -Path $pyd.FullName -Destination "$ProjectRoot\src\core\$mod.pyd" -Force
        Write-Host "[+] Thanh cong: $mod.pyd ($([math]::Round($pyd.Length / 1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "[!] That bai: khong tim thay file .pyd cho $mod" -ForegroundColor Red
    }
    Remove-Item -Recurse -Force $buildDir -ErrorAction SilentlyContinue
}

# Copy recaptcha_solver.py (or keep as helper)
Copy-Item -Path "$ProjectRoot\src\core\recaptcha_solver.py" -Destination "$ReleaseDir\src\core\recaptcha_solver.py" -Force
New-Item -ItemType File -Path "$ReleaseDir\src\core\__init__.py" -Force | Out-Null

# Copy UI & helper scripts
Copy-Item -Path "$ProjectRoot\src\ui\menu.js" -Destination "$ReleaseDir\src\ui\menu.js" -Force
Copy-Item -Path "$ProjectRoot\package.json" -Destination "$ReleaseDir\package.json" -Force
Copy-Item -Path "$ProjectRoot\README.md" -Destination "$ReleaseDir\README.md" -Force
Copy-Item -Path "$ProjectRoot\scripts\bootstrap.ps1" -Destination "$ReleaseDir\scripts\bootstrap.ps1" -Force
Copy-Item -Path "$ProjectRoot\scripts\Cai_Dat_Moi_Truong.bat" -Destination "$ReleaseDir\scripts\Cai_Dat_Moi_Truong.bat" -Force

# Compile native Windows EXE launcher
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (Test-Path $csc) {
    Write-Host "`n[*] Dang bien dich Link4M_Bypass.exe bang C#..." -ForegroundColor Cyan
    & $csc /nologo /target:exe /out:"$ReleaseDir\Link4M_Bypass.exe" /optimize+ "$ProjectRoot\scripts\Launcher.cs"
    Copy-Item -Path "$ReleaseDir\Link4M_Bypass.exe" -Destination "$ProjectRoot\Link4M_Bypass.exe" -Force
    Write-Host "[+] Da tao Link4M_Bypass.exe thanh cong!" -ForegroundColor Green
}

# Clean temp
if (Test-Path "$ProjectRoot\build_test_pyd") { Remove-Item -Recurse -Force "$ProjectRoot\build_test_pyd" }

# Zip release package
Write-Host "`n[*] Dong goi ban Native Binary Release (.zip)..." -ForegroundColor Cyan
$zipFile = "$ProjectRoot\Link4M_Native_Binary_Release.zip"
if (Test-Path $zipFile) { Remove-Item -Force $zipFile }
Compress-Archive -Path "$ReleaseDir\*" -DestinationPath $zipFile -Force
Copy-Item -Path $zipFile -Destination "C:\Users\XUAN\.gemini\antigravity\scratch\Link4M_Native_Binary_Release.zip" -Force

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  HOAN TAT DONG GOI NATIVE BINARY!" -ForegroundColor Green
Write-Host "  - File zip san sang public: $zipFile" -ForegroundColor Yellow
Write-Host "  - Logic Bypass & Sponsor da duoc bao ve 100% duoi dang Machine Code .pyd!" -ForegroundColor Yellow
Write-Host "=======================================================`n" -ForegroundColor Green
