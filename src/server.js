const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const winston = require('winston');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  port: process.env.PORT || 10000,
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || './data/mcp.db',
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Setup logging
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();

// Enhanced CORS configuration for Claude
const corsOptions = {
  origin: '*', // Allow all origins for Claude integration
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers need this
};

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Database setup
const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const db = new sqlite3.Database(config.dbPath, (err) => {
      if (err) {
        logger.error('Database connection failed', { error: err.message });
        reject(err);
      } else {
        logger.info('Connected to SQLite database');
        
        db.serialize(() => {
          db.run(`CREATE TABLE IF NOT EXISTS mcp_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            type TEXT DEFAULT 'string',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
        });
        
        resolve(db);
      }
    });
  });
};

// Initialize server
const initServer = async () => {
  try {
    const db = await setupDatabase();

    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // MCP Discovery endpoint - required by Claude
    app.get('/.well-known/mcp', (req, res) => {
      // Set explicit headers for Claude
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Content-Type', 'application/json');
      
      res.json({
        mcp_version: "1.0",
        name: "MCP Complete Server",
        description: "SQLite-based MCP server for Claude integration",
        tools: [
          {
            name: "sqlite_get",
            description: "Get value by key",
            input_schema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Key to retrieve" }
              },
              required: ["key"]
            }
          },
          {
            name: "sqlite_set",
            description: "Set key-value pair",
            input_schema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Key to set" },
                value: { type: "string", description: "Value to store" }
              },
              required: ["key", "value"]
            }
          },
          {
            name: "sqlite_delete",
            description: "Delete key",
            input_schema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Key to delete" }
              },
              required: ["key"]
            }
          },
          {
            name: "sqlite_list",
            description: "List all keys",
            input_schema: {
              type: "object",
              properties: {
                pattern: { type: "string", description: "Optional pattern to filter keys" }
              }
            }
          }
        ]
      });
    });

    // MCP endpoint
    app.post('/mcp/call', async (req, res) => {
      // Set explicit headers
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Content-Type', 'application/json');
      
      try {
        const { tool, parameters } = req.body;
        
        // Validate request
        if (!tool) {
          return res.status(400).json({ error: 'Missing tool parameter' });
        }
        
        switch(tool) {
          case 'sqlite_get':
            db.get('SELECT value FROM mcp_data WHERE key = ?', [parameters.key], (err, row) => {
              if (err) {
                res.status(500).json({ error: err.message });
              } else {
                res.json({ value: row ? row.value : null });
              }
            });
            break;
            
          case 'sqlite_set':
            db.run(
              'INSERT OR REPLACE INTO mcp_data (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
              [parameters.key, parameters.value],
              function(err) {
                if (err) {
                  res.status(500).json({ error: err.message });
                } else {
                  res.json({ success: true, key: parameters.key });
                }
              }
            );
            break;
            
          case 'sqlite_delete':
            db.run('DELETE FROM mcp_data WHERE key = ?', [parameters.key], function(err) {
              if (err) {
                res.status(500).json({ error: err.message });
              } else {
                res.json({ success: true, deleted: this.changes > 0 });
              }
            });
            break;
            
          case 'sqlite_list':
            const pattern = parameters.pattern || '%';
            db.all('SELECT key FROM mcp_data WHERE key LIKE ?', [pattern], (err, rows) => {
              if (err) {
                res.status(500).json({ error: err.message });
              } else {
                res.json({ keys: rows.map(r => r.key) });
              }
            });
            break;
            
          default:
            res.status(400).json({ error: 'Unknown tool' });
        }
      } catch (error) {
        logger.error('Tool execution failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Start server
    app.listen(config.port, config.host, () => {
      logger.info(`MCP Server started on ${config.host}:${config.port}`);
      console.log(`
🚀 MCP Complete Server is running!
📍 Address: http://${config.host}:${config.port}
🏥 Health: http://${config.host}:${config.port}/health
🔧 MCP Discovery: http://${config.host}:${config.port}/.well-known/mcp
      `);
    });

  } catch (error) {
    logger.error('Server initialization failed', { error: error.message });
    process.exit(1);
  }
};

// Start server
initServer();