# MCP Complete - Claude Desktop Extension

This is the Claude Desktop extension (.dxt) package for the MCP Complete Server.

## Installation

1. Build the .dxt package:
   ```bash
   npm run build-dxt
   ```

2. Install in Claude Desktop:
   - Open Claude Desktop
   - Go to Extensions
   - Click "Install from file"
   - Select `mcp-complete.dxt`

## Features

- **sqlite_get**: Retrieve values from persistent storage
- **sqlite_set**: Store key-value pairs
- **sqlite_delete**: Remove stored values
- **sqlite_list**: List all keys with pattern matching

## Usage

Once installed, you can use the MCP tools directly in Claude Desktop:

```
Use the sqlite_set tool to store my API key "sk-12345" with the key "openai_key"
```

```
Use the sqlite_get tool to retrieve the value for key "openai_key"
```

```
Use the sqlite_list tool to show all stored keys
```

## Data Storage

Data is stored locally in:
- macOS/Linux: `~/.mcp-complete/data.db`
- Windows: `%USERPROFILE%\.mcp-complete\data.db`

## Building from Source

```bash
cd claude-desktop
npm install
cd ..
npm run build-dxt
```

This creates `mcp-complete.dxt` in the root directory.