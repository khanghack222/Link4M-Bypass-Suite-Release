@echo off
chcp 65001 >nul
title Bi?n d?ch Bypass.py sang C Extension (.pyd)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build_pyd.ps1"
