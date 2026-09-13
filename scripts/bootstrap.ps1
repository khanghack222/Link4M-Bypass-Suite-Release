# Set UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 >$null 2>&1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path "$ScriptDir\..").Path
Set-Location $ProjectRoot

# Update Path from Registry to get any newly installed apps
function Refresh-EnvPath {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Write-Step($msg) {
    Write-Host "  [*] $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "  [+] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "  [!] $msg" -ForegroundColor Yellow
}

# 1. Check Python
$pythonCmd = $null
$candidates = @(
    "python",
    "C:\Users\XUAN\AppData\Local\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "C:\Python311\python.exe",
    "C:\Python312\python.exe"
)

foreach ($c in $candidates) {
    if (Get-Command $c -ErrorAction SilentlyContinue) {
        $pythonCmd = $c
        break
    } elseif (Test-Path $c) {
        $pythonCmd = $c
        break
    }
}

if (-not $pythonCmd) {
    Write-Warn "Chưa tìm thấy Python. Đang tự động tải và cài đặt Python 3.11..."
    $pyInstaller = "$env:TEMP\python-3.11.9-amd64.exe"
    try {
        Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe" -OutFile $pyInstaller -UseBasicParsing
        Start-Process -FilePath $pyInstaller -ArgumentList "/quiet InstallAllUsers=0 PrependPath=1 Include_pip=1" -Wait
        Remove-Item $pyInstaller -Force -ErrorAction SilentlyContinue
        Refresh-EnvPath
        $pythonCmd = "python"
        Write-Success "Đã cài đặt Python 3.11 thành công."
    } catch {
        Write-Warn "Cài đặt Python tự động qua web không thành công, thử dùng winget..."
        winget install Python.Python.3.11 --silent --accept-source-agreements --accept-package-agreements
        Refresh-EnvPath
        $pythonCmd = "python"
    }
}

# 2. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warn "Chưa tìm thấy Node.js. Đang tự động tải và cài đặt Node.js LTS..."
    $nodeMsi = "$env:TEMP\node-v20.18.0-x64.msi"
    try {
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi" -OutFile $nodeMsi -UseBasicParsing
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodeMsi`" /qn" -Wait
        Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
        Refresh-EnvPath
        Write-Success "Đã cài đặt Node.js thành công."
    } catch {
        winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
        Refresh-EnvPath
    }
}

# 3. Check FFmpeg (cần cho Whisper)
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Step "Đang cài đặt FFmpeg cho Whisper Captcha..."
    winget install Gyan.FFmpeg --silent --accept-source-agreements --accept-package-agreements | Out-Null
    Refresh-EnvPath
}

# 4. Check Python Dependencies
$checkScript = "import playwright, whisper, rapidocr_onnxruntime"
$testDep = & $pythonCmd -c $checkScript 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Step "Đang cài đặt thư viện Python (playwright, whisper, rapidocr, torch)..."
    & $pythonCmd -m pip install --upgrade pip --quiet
    & $pythonCmd -m pip install playwright openai-whisper rapidocr-onnxruntime onnxruntime --quiet
    & $pythonCmd -m playwright install chromium
    Write-Success "Đã hoàn tất cài đặt thư viện."
}

# 5. Khởi chạy Menu chính
Clear-Host
if (Get-Command node -ErrorAction SilentlyContinue) {
    node "$ProjectRoot\src\ui\menu.js"
} else {
    Write-Warn "Vui lòng khởi động lại máy hoặc terminal một lần để nhận biến môi trường Node.js."
    pause
}
