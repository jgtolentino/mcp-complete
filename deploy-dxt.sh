#!/bin/bash

# 🚀 Quick DXT Desktop Deployment Script

set -e

echo "🎯 MCP Desktop Quick Deployment"
echo "================================"

# Change to project directory
cd /Users/tbwa/Documents/GitHub/mcp-complete-setup

# Make build script executable
chmod +x build-desktop.sh

echo "📦 Starting deployment process..."

# Run the build
./build-desktop.sh

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📍 Your desktop app is ready in: desktop/dist/"
echo ""
echo "📱 Installation:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   macOS: Open the .dmg file and drag to Applications"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "   Linux: chmod +x desktop/dist/*.AppImage && ./desktop/dist/*.AppImage"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "   Windows: Run the .exe installer"
fi
echo ""
echo "🚀 After installation:"
echo "   1. Launch the MCP Desktop app"
echo "   2. Check system tray for the MCP icon"
echo "   3. Right-click tray icon → 'Open in Browser'"
echo "   4. Test health endpoint: http://localhost:10000/health"
echo "   5. Connect Claude Web App to: http://localhost:10000"
echo ""
echo "🎯 You're ready to use MCP with Claude!"
