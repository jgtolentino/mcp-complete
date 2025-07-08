const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// MCP protocol handler for Claude Desktop
class MCPServer {
  constructor() {
    const dbPath = path.join(process.env.HOME || process.env.USERPROFILE, '.mcp-complete', 'data.db');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async handleTool(toolName, params) {
    switch (toolName) {
      case 'sqlite_get':
        return this.getValue(params.key);
      
      case 'sqlite_set':
        return this.setValue(params.key, params.value);
      
      case 'sqlite_delete':
        return this.deleteValue(params.key);
      
      case 'sqlite_list':
        return this.listKeys(params.pattern);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  getValue(key) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT value FROM store WHERE key = ?', [key], (err, row) => {
        if (err) reject(err);
        else resolve({ key, value: row ? row.value : null });
      });
    });
  }

  setValue(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO store (key, value, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [key, value],
        (err) => {
          if (err) reject(err);
          else resolve({ key, value, saved: true });
        }
      );
    });
  }

  deleteValue(key) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM store WHERE key = ?', [key], function(err) {
        if (err) reject(err);
        else resolve({ key, deleted: this.changes > 0 });
      });
    });
  }

  listKeys(pattern) {
    return new Promise((resolve, reject) => {
      const query = pattern 
        ? 'SELECT key FROM store WHERE key LIKE ? ORDER BY key'
        : 'SELECT key FROM store ORDER BY key';
      const params = pattern ? [`%${pattern}%`] : [];
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ keys: rows.map(r => r.key), count: rows.length });
      });
    });
  }

  // Claude Desktop communication protocol
  async processMessage(message) {
    try {
      const { tool, parameters } = message;
      const result = await this.handleTool(tool, parameters);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Initialize server for Claude Desktop
const server = new MCPServer();

// Claude Desktop IPC handler
process.on('message', async (message) => {
  const response = await server.processMessage(message);
  process.send(response);
});

// Keep process alive
process.stdin.resume();

console.log('MCP Server for Claude Desktop started');