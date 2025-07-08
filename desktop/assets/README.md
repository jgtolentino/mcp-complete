# Desktop App Icons

This directory should contain:

- `icon.png` - Main application icon (256x256 PNG)
- `icon.icns` - macOS icon file
- `icon.ico` - Windows icon file  
- `tray-icon.png` - System tray icon (16x16 or 32x32 PNG)

## Quick Icon Setup

You can use any 256x256 PNG image as your base icon. Tools like:
- **macOS**: `sips -z 256 256 image.png -o icon.png`
- **Online**: Use png2ico.com to convert PNG to ICO
- **IconUtil**: For creating ICNS files

## Temporary Solution

The app will work without icons, but you'll see default Electron icons.
