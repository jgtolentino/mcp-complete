#!/bin/bash

echo "🏗️ Building MCP Desktop Application..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the mcp-complete-setup directory"
    exit 1
fi

# Install main dependencies first
echo "📦 Installing server dependencies..."
npm install

# Install desktop dependencies
echo "📦 Installing desktop dependencies..."
cd desktop
npm install

# Build for current platform
echo "🔨 Building desktop app..."
npm run dist

echo "✅ Build complete! Check the desktop/dist folder for the installer."
echo ""
echo "📱 Platform-specific files:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   macOS: desktop/dist/*.dmg"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "   Linux: desktop/dist/*.AppImage"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "   Windows: desktop/dist/*.exe"
fi