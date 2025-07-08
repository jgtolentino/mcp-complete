# MCP Desktop Application

Electron-based desktop application for running the MCP server locally.

## Features

- 🖥️ Native desktop application
- 🔄 Automatic server management
- 📊 Real-time server status
- 🔧 Built-in endpoint testing
- 💾 System tray integration
- 📱 Cross-platform support

## Installation

```bash
cd desktop
npm install
```

## Development

```bash
# Run in development mode
npm start
```

## Building

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run build-mac
npm run build-win
npm run build-linux
```

## Distribution

Built applications will be in the `dist` folder:
- macOS: `.dmg` file
- Windows: `.exe` installer
- Linux: `.AppImage` file

## Usage

1. Launch the application
2. The MCP server starts automatically
3. Access the server at `http://localhost:10000`
4. Use the system tray menu for quick access
5. Test endpoints directly from the UI

## Icons

Add platform-specific icons to the `assets` folder:
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon
- `icon.png` - Linux icon (512x512)
- `tray-icon.png` - System tray icon (16x16 or 24x24)