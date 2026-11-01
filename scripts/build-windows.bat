@echo off
title Build Housing Application (win-x64)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1"
pause
