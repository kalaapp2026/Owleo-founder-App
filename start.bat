@echo off
cd /d "%~dp0"
start "" cmd /c "timeout /t 1 >nul & start http://localhost:3000"
node server.js
pause
