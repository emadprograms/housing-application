@echo off
title Reinstall Housing Application 24/7 Service
echo Requesting Administrator privileges...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0reinstall-service.ps1"
