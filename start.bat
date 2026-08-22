@echo off
title MiniBase Studio
color 0A
echo ===================================================
echo   ⚡ MiniBase BaaS — Local Studio Launcher
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
    echo [1/2] Installing dependencies...
    call npm install --no-audit --no-fund
)

:: Launch browser directly
timeout /t 1 /nobreak >nul
start "" "http://localhost:8090/_/"

:: Start MiniBase server
echo [2/2] Launching MiniBase Studio on http://localhost:8090/_/ ...
node bin/minibase.js serve

pause
