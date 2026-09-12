@echo off
chcp 65001 >nul
title [LINK4M BYPASS SUITE] - BỘ CÀI ĐẶT TỰ ĐỘNG & KIỂM TRA MÔI TRƯỜNG
color 0B
cls

echo ===============================================================================
echo        ⚡ LINK4M ULTIMATE BYPASS SUITE - AUTOMATIC SETUP & DEPENDENCY INSTALLER ⚡
echo ===============================================================================
echo.
echo [*] Đang kiểm tra môi trường hệ thống...
echo.

:: 1. Kiểm tra Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] CẢNH BÁO: Chưa tìm thấy Python trong hệ thống PATH!
    echo [*] Vui lòng tải và cài đặt Python 3.10 hoặc 3.11 từ https://www.python.org/
    echo     (Hãy tích chọn "Add Python to PATH" khi cài đặt)
    pause
    exit /b 1
) else (
    echo [+] Python đã được cài đặt:
    python --version
)

:: 2. Kiểm tra Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] CẢNH BÁO: Chưa tìm thấy Node.js!
    echo [*] Vui lòng tải Node.js LTS từ https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [+] Node.js đã được cài đặt:
    node --version
)

:: 3. Kiểm tra FFmpeg (cần cho Whisper giải Audio Captcha)
where ffmpeg >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [*] FFmpeg chưa có trong PATH. Đang tự động tải FFmpeg portable...
    powershell -NoProfile -Command "winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements" >nul 2>&1
) else (
    echo [+] FFmpeg đã sẵn sàng!
)

:: 4. Kiểm tra Windows Terminal (wt.exe)
where wt.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] Đang tự động cài đặt Windows Terminal (wt) từ Microsoft Store...
    powershell -NoProfile -Command "winget install Microsoft.WindowsTerminal --accept-source-agreements --accept-package-agreements" >nul 2>&1
) else (
    echo [+] Windows Terminal (wt.exe) đã sẵn sàng!
)

:: 5. Cài đặt các thư viện Python cần thiết
echo.
echo [*] Đang cài đặt / nâng cấp các thư viện Python: playwright, openai-whisper, rapidocr-onnxruntime...
python -m pip install --upgrade pip
python -m pip install playwright openai-whisper rapidocr-onnxruntime onnxruntime torchaudio

:: 6. Cài đặt Playwright Chromium driver
echo.
echo [*] Đang cài đặt trình duyệt tự động hóa Playwright...
python -m playwright install chromium

:: 7. Biên dịch launcher Link4M_Bypass.exe
echo.
echo [*] Đang biên dịch Link4M_Bypass.exe...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:Link4M_Bypass.exe Launcher.cs >nul 2>&1

echo.
echo ===============================================================================
echo  Cài đặt hoàn tất.
echo  Mở 'Link4M_Bypass.exe' để chạy chương trình.
echo ===============================================================================
echo.
pause
