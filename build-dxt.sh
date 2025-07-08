#!/bin/bash

echo "🏗️ Building Claude Desktop Extension (.dxt)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the mcp-complete-setup directory"
    exit 1
fi

# Create temp directory for building
TEMP_DIR="temp_dxt_build"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy Claude Desktop files
echo "📁 Copying extension files..."
cp -r claude-desktop/* $TEMP_DIR/

# Install dependencies in temp directory
echo "📦 Installing dependencies..."
cd $TEMP_DIR
npm install --production --no-audit --no-fund

# Remove unnecessary files
echo "🧹 Cleaning up..."
rm -rf node_modules/.bin
rm -rf node_modules/*/test
rm -rf node_modules/*/tests
rm -rf node_modules/*/.github
rm -rf node_modules/*/docs
rm -rf node_modules/*/examples
find . -name "*.md" -not -name "README.md" -delete
find . -name ".npmignore" -delete
find . -name ".gitignore" -delete

# Create the .dxt package
echo "📦 Creating .dxt package..."
cd ..
zip -r mcp-complete.dxt $TEMP_DIR/* -x "*.DS_Store"

# Clean up temp directory
rm -rf $TEMP_DIR

echo "✅ Build complete!"
echo ""
echo "📱 Claude Desktop Extension created: mcp-complete.dxt"
echo ""
echo "To install in Claude Desktop:"
echo "1. Open Claude Desktop"
echo "2. Go to Extensions → Install from file"
echo "3. Select mcp-complete.dxt"
echo ""
echo "The extension provides these MCP tools:"
echo "  • sqlite_get - Retrieve stored values"
echo "  • sqlite_set - Store key-value pairs"
echo "  • sqlite_delete - Delete stored values"
echo "  • sqlite_list - List all keys"