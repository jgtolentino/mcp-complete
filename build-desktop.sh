#!/bin/bash
set -e

echo "🏗️ MCP Desktop Application Builder"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the mcp-complete-setup directory"
    exit 1
fi

# Parse command line arguments
MODE="dev"
if [ "$1" == "build" ] || [ "$1" == "dist" ]; then
    MODE="build"
elif [ "$1" == "dev" ] || [ "$1" == "start" ]; then
    MODE="dev"
fi

# Install main dependencies first
echo "📦 Installing server dependencies..."
npm install

# Generate icons if they don't exist
if [ ! -f "desktop/assets/icon.png" ]; then
    echo "🎨 Generating default icons..."
    mkdir -p desktop/assets
    # Create a simple default icon using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 256x256 xc:'#3498db' \
                -fill white -gravity center \
                -pointsize 72 -annotate +0+0 'MCP' \
                desktop/assets/icon.png
        convert desktop/assets/icon.png -resize 16x16 desktop/assets/tray-icon.png
    else
        echo "⚠️  ImageMagick not found. Using placeholder icons..."
        # Create placeholder files
        touch desktop/assets/icon.png
        touch desktop/assets/tray-icon.png
    fi
fi

# Install desktop dependencies
echo "📦 Installing desktop dependencies..."
cd desktop
npm install

if [ "$MODE" == "dev" ]; then
    echo ""
    echo "🚀 Starting MCP Desktop in development mode..."
    echo "   Server: http://localhost:10000"
    echo "   Press Ctrl+C to stop"
    echo ""
    npm start
else
    echo ""
    echo "🔨 Building desktop installer..."
    npm run dist
    
    echo ""
    echo "✅ Build complete! Check the desktop/dist folder for the installer."
    echo ""
    echo "📱 Platform-specific files:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   macOS: desktop/dist/*.dmg"
        ls -la dist/*.dmg 2>/dev/null || echo "   (No .dmg files found)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   Linux: desktop/dist/*.AppImage"
        ls -la dist/*.AppImage 2>/dev/null || echo "   (No .AppImage files found)"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "   Windows: desktop/dist/*.exe"
        ls -la dist/*.exe 2>/dev/null || echo "   (No .exe files found)"
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "   1. Install the app using the installer above"
    echo "   2. Launch MCP Desktop from your Applications folder"
    echo "   3. The MCP server will start automatically"
    echo "   4. Connect Claude to http://localhost:10000"
fi