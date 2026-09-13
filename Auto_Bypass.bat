@echo off
chcp 65001 >nul
title Universal Shortlink Auto Bypass Engine
setlocal

:: Locate Python 3.11/3.12 or fallback
set "PYTHON_EXE=C:\Users\XUAN\AppData\Local\Programs\Python\Python311\python.exe"
if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=python"
)

"%PYTHON_EXE%" "%~dp0auto_bypass.py" %*

if "%~1"=="" (
    pause
)
