#!/bin/bash
# Mission Control — Quick Setup Script
# Run this with: bash setup.sh
#
# This script checks prerequisites, installs dependencies, and gets you running.
# It's safe to re-run — it won't overwrite your config or database.

set -e

echo ""
echo "=========================================="
echo "  Mission Control — Setup"
echo "=========================================="
echo ""

# ── Check Node.js ──
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "   Install it from: https://nodejs.org (download the LTS version)"
    echo "   Or with Homebrew: brew install node"
    echo ""
    echo "   After installing, run this script again."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $(node -v) is too old. Need v18 or higher."
    echo "   Update at: https://nodejs.org"
    exit 1
fi
echo "✓ Node.js $(node -v)"

# ── Check npm ──
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed (should come with Node.js)."
    exit 1
fi
echo "✓ npm $(npm -v)"

# ── Check C++ build tools (macOS) ──
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! xcode-select -p &> /dev/null; then
        echo ""
        echo "⚠️  Xcode Command Line Tools not found."
        echo "   These are needed to compile the database driver."
        echo ""
        read -p "   Install them now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            xcode-select --install
            echo ""
            echo "   A dialog should have appeared. Complete the installation,"
            echo "   then run this script again."
            exit 0
        else
            echo "   You can install later with: xcode-select --install"
            echo "   npm install may fail without them."
        fi
    else
        echo "✓ Xcode Command Line Tools"
    fi
fi

# ── Check Python (optional) ──
if command -v python3 &> /dev/null; then
    echo "✓ Python $(python3 --version 2>&1 | awk '{print $2}') (for mc.py CLI)"
else
    echo "○ Python 3 not found (optional — needed for mc.py CLI)"
fi

echo ""

# ── Install npm dependencies ──
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# ── Create config.json if missing ──
if [ ! -f "config.json" ]; then
    echo ""
    echo "──────────────────────────────────────────"
    echo "  No config.json found."
    echo ""
    echo "  Option 1: Copy the example and edit it:"
    echo "    cp config.example.json config.json"
    echo ""
    echo "  Option 2: Ask your AI assistant to read"
    echo "    BUILD_GUIDE.md and set it up for you."
    echo "──────────────────────────────────────────"
else
    echo "✓ config.json exists"
fi

echo ""
echo "=========================================="
echo "  Setup complete!"
echo ""
echo "  Start the dashboard:"
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:3100"
echo "=========================================="
echo ""
