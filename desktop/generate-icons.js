const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Generate icon function
function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3498db');
  gradient.addColorStop(1, '#2c3e50');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Border
  ctx.strokeStyle = '#1abc9c';
  ctx.lineWidth = size * 0.03;
  const borderOffset = size * 0.02;
  ctx.strokeRect(borderOffset, borderOffset, size - borderOffset * 2, size - borderOffset * 2);
  
  // MCP Text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.2}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MCP', size / 2, size * 0.4);
  
  // Desktop Text (for larger icons)
  if (size >= 128) {
    ctx.font = `bold ${size * 0.1}px sans-serif`;
    ctx.fillText('Desktop', size / 2, size * 0.55);
  }
  
  // Connection symbol (for larger icons)
  if (size >= 64) {
    const symbolY = size * 0.75;
    const symbolRadius = size * 0.08;
    
    // Center node
    ctx.beginPath();
    ctx.arc(size / 2, symbolY, symbolRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1abc9c';
    ctx.fill();
    
    // Connected lines
    ctx.strokeStyle = '#1abc9c';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    
    // Left connection
    ctx.moveTo(size / 2 - symbolRadius, symbolY);
    ctx.lineTo(size * 0.3, symbolY + size * 0.08);
    
    // Right connection
    ctx.moveTo(size / 2 + symbolRadius, symbolY);
    ctx.lineTo(size * 0.7, symbolY + size * 0.08);
    
    // Bottom connection
    ctx.moveTo(size / 2, symbolY + symbolRadius);
    ctx.lineTo(size / 2, symbolY + size * 0.15);
    
    ctx.stroke();
    
    // End nodes
    const nodeRadius = size * 0.02;
    ctx.fillStyle = '#1abc9c';
    
    ctx.beginPath();
    ctx.arc(size * 0.3, symbolY + size * 0.08, nodeRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(size * 0.7, symbolY + size * 0.08, nodeRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(size / 2, symbolY + size * 0.15, nodeRadius, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
  console.log(`✅ Generated ${filename} (${size}x${size})`);
}

// Generate all required icon sizes
console.log('🎨 Generating MCP Desktop icons...\n');

// Main application icon
generateIcon(512, 'icon.png');
generateIcon(256, 'icon@2x.png');
generateIcon(128, 'icon@1x.png');

// System tray icons
generateIcon(16, 'tray-icon.png');
generateIcon(32, 'tray-icon@2x.png');

// Windows icon (will need conversion to .ico)
generateIcon(256, 'icon-win.png');

// macOS icon (will need conversion to .icns)
generateIcon(1024, 'icon-mac.png');

console.log('\n✅ All icons generated successfully!');
console.log('\n📝 Note: For production, convert:');
console.log('   - icon-win.png → icon.ico (for Windows)');
console.log('   - icon-mac.png → icon.icns (for macOS)');
console.log('   You can use online converters or ImageMagick.');