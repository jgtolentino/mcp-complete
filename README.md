# MCP Complete Server

A clean, simple Model Context Protocol (MCP) server for Claude integration.

## Features

- SQLite-based persistent storage
- MCP discovery endpoint for Claude compatibility
- Simple key-value operations
- Production-ready with health checks
- Render deployment ready

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run locally
npm start

# Server runs on http://localhost:10000
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