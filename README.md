# MCP Complete Server

A clean, simple Model Context Protocol (MCP) server for Claude integration with desktop app support.

## Features

- SQLite-based persistent storage
- MCP discovery endpoint for Claude compatibility
- Simple key-value operations
- Production-ready with health checks
- Render deployment ready
- Desktop application with Electron
- System tray integration
- Cross-platform support (macOS, Windows, Linux)

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run locally
npm start

# Server runs on http://localhost:10000
```

### Desktop Application

```bash
# Build desktop app
./build-desktop.sh

# Or manually:
cd desktop
npm install
npm start  # Development
npm run dist  # Build installer
```

### Deploy to Render

1. Push to GitHub
2. Connect to Render
3. Deploy using the included `render.yaml`

### Claude Integration

Once deployed, add to Claude Web App:
- **URL**: `https://your-app.onrender.com`
- **Type**: HTTP
- **Auth**: None

## Available MCP Tools

- `sqlite_get` - Retrieve value by key
- `sqlite_set` - Store key-value pair
- `sqlite_delete` - Delete key
- `sqlite_list` - List all keys

## Endpoints

- `GET /health` - Health check
- `GET /.well-known/mcp` - MCP discovery
- `POST /mcp/call` - Execute MCP tools

## License

MIT