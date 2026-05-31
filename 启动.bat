@echo off
chcp 65001 >nul
title Rz Agent Web

:: Use managed Node.js 22.22.2
set "NODE_DIR=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2"
set "PATH=%NODE_DIR%;%PATH%"

cd /d "%~dp0"

echo ========================================
echo   Rz Agent Web v0.1.5
echo   http://localhost:30141
echo ========================================

npx next start -p 30141

pause
