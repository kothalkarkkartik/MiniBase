#!/usr/bin/env bash

echo "==================================================="
echo "  Starting MiniBase Backend-as-a-Service (BaaS)   "
echo "==================================================="

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

# Install dependencies if not installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --no-audit --no-fund
fi

# Start MiniBase
echo "Launching MiniBase on http://localhost:8090/_/ ..."
node bin/minibase.js serve --open
