@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Rz Agent Web - Setup

:: Use managed Node.js 22.22.2 (required for this project)
set "NODE_DIR=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2"
set "PATH=%NODE_DIR%;%PATH%"

cd /d "%~dp0"

echo.
echo ========================================
echo   Rz Agent Web - Setup
echo ========================================
echo.

:: ---- Step 0: Stop any running server ----
echo [0/4] Stopping any running server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: ---- Step 1: Clean build output ----
echo [1/4] Cleaning build output...
if exist ".next-build" (
    rd /S /Q ".next-build" >nul 2>&1
)
if exist ".next" (
    rd /S /Q ".next" >nul 2>&1
)
:: Also clean webpack cache
timeout /t 1 /nobreak >nul

:: ---- Step 2: Verify Node version ----
echo [2/4] Checking Node.js version...
for /f "tokens=*" %%a in ('node -v 2^>nul') do set "NODE_VER=%%a"
echo   Node.js: %NODE_VER%

:: ---- Step 3: Install ----
if not exist "node_modules\next\package.json" (
    echo [3/4] Installing dependencies...
    set NODE_ENV=development
    call npm install --registry https://registry.npmjs.org/ 2>&1
    if %errorlevel% neq 0 (
        echo [FAIL] npm install failed. Check your network.
        pause
        exit /b 1
    )
    echo [3/4] Done.
) else (
    echo [3/4] Dependencies already installed.
)

:: ---- Step 4: Build ----
echo [4/4] Building...
set NODE_ENV=production
call npx next build --webpack 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Build failed.
    pause
    exit /b 1
)
echo [4/4] Done.

:: ---- Step 5: Start ----
echo.
echo ========================================
echo   Rz Agent Web
echo   http://localhost:30141
echo ========================================
echo.

npx next start -p 30141
pause
