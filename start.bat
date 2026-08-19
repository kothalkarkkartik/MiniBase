@echo off
title MiniBase Studio
echo ===================================================
echo   Starting MiniBase Backend-as-a-Service (BaaS)
echo ===================================================

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 20+ from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists, otherwise install dependencies
if not exist node_modules (
    echo Installing dependencies...
    call npm install --no-audit --no-fund
)

:: Start MiniBase with auto-open browser
echo Launching MiniBase on http://localhost:8090/_/ ...
node bin/minibase.js serve --open

pause
