@echo off
title Install Housing Application 24/7 Service
echo Requesting Administrator privileges...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& {Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0install-service.ps1""' -Verb RunAs}"
