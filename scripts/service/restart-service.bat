@echo off
title Restart Housing Application 24/7 Service
powershell -NoProfile -ExecutionPolicy Bypass -Command "& {Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0restart-service.ps1""' -Verb RunAs}"
