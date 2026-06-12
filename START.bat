@echo off
title Ascend Launcher
echo.
echo  Starting Ascend...
echo.
echo  Two windows will open - KEEP BOTH OPEN while using the app:
echo    1. "Ascend API"      - the backend server + database
echo    2. "Ascend Frontend" - the website
echo.
start "Ascend API" cmd /k "cd /d %~dp0server && npm run dev:local"
timeout /t 5 /nobreak >nul
start "Ascend Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 7 /nobreak >nul
echo  Opening the app in your browser...
start http://localhost:5173
echo.
echo  Phone (same Wi-Fi): http://192.168.0.105:5173
echo  To stop the app: close the two windows that opened.
echo.
pause
