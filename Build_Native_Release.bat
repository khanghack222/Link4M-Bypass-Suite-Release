@echo off
chcp 65001 >nul
title Link4M Native Binary Builder
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build_all_native.ps1"
pause
