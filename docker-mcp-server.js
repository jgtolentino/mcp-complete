// Docker-enabled MCP Server
// Save this as docker-mcp-server.js in your mcp-complete-setup directory

const express = require('express');
const cors = require('cors');
const winston = require('winston');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Try to load PostgreSQL, fall back to SQLite if not available
let Pool;
try {
  Pool = require('pg').Pool;
} catch (error) {
  console.log('PostgreSQL not available, using SQLite only');
}

class DockerMCPServer {
  constructor() {
    this.app = express();
    this.PORT = process.env.PORT || 10000;
    this.setupLogging();
    this.setupDatabases();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupLogging() {
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/mcp-server.log' })
      ]
    });
  }

  setupDatabases() {
    // PostgreSQL connection (Docker container)
    if (Pool) {
      this.pgPool = new Pool({
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'mcp_demo',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        port: process.env.POSTGRES_PORT || 5432,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.initializePgTables();
    }

    // SQLite connection (local fallback)
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'mcp.db');
    this.sqlite = new sqlite3.Database(dbPath);
    
    this.sqlite.serialize(() => {
      this.sqlite.run(`CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }

  async initializePgTables() {
    if (!this.pgPool) return;

    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS mcp_data (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value TEXT,
          data_type VARCHAR(50) DEFAULT 'string',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.logger.info('PostgreSQL tables initialized');
    } catch (error) {
      this.logger.error('PostgreSQL initialization failed:', error);
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // Health check with database status
    this.app.get('/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        databases: {
          sqlite: 'available',
          postgresql: this.pgPool ? 'checking...' : 'not configured'
        }
      };

      // Check PostgreSQL connection
      if (this.pgPool) {
        try {
          await this.pgPool.query('SELECT NOW()');
          health.databases.postgresql = 'connected';
        } catch (error) {
          health.databases.postgresql = 'disconnected';
          health.status = 'degraded';
        }
      }

      res.json(health);
    });

    // MCP Discovery
    this.app.get('/.well-known/mcp', (req, res) => {
      const tools = [
        {
          name: "sqlite_set",
          description: "Store data in SQLite",
          input_schema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Data key" },
              value: { type: "string", description: "Data value" }
            },
            required: ["key", "value"]
          }
        },
        {
          name: "sqlite_get",
          description: "Retrieve data from SQLite",
          input_schema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Data key" }
            },
            required: ["key"]
          }
        },
        {
          name: "sqlite_list",
          description: "List SQLite keys",
          input_schema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "Key pattern filter" }
            }
          }
        },
        {
          name: "db_status",
          description: "Get database connection status",
          input_schema: {
            type: "object",
            properties: {}
          }
        }
      ];

      // Add PostgreSQL tools if available
      if (this.pgPool) {
        tools.unshift(
          {
            name: "pg_set",
            description: "Store data in PostgreSQL",
            input_schema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Data key" },
                value: { type: "string", description: "Data value" }
              },
              required: ["key", "value"]
            }
          },
          {
            name: "pg_get",
            description: "Retrieve data from PostgreSQL",
            input_schema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Data key" }
              },
              required: ["key"]
            }
          },
          {
            name: "pg_query",
            description: "Execute SQL query on PostgreSQL",
            input_schema: {
              type: "object",
              properties: {
                query: { type: "string", description: "SQL query" },
                params: { type: "array", description: "Query parameters" }
              },
              required: ["query"]
            }
          }
        );
      }

      res.json({
        mcp_version: "1.0",
        name: "MCP Docker Database Server",
        description: "MCP server with Docker PostgreSQL and SQLite support",
        tools: tools
      });
    });

    // MCP Tool execution
    this.app.post('/mcp/call', async (req, res) => {
      const { tool, parameters } = req.body;
      
      try {
        const result = await this.executeTool(tool, parameters);
        res.json(result);
      } catch (error) {
        this.logger.error(`Tool execution failed: ${tool}`, error);
        res.status(500).json({ 
          success: false, 
          error: error.message,
          tool: tool
        });
      }
    });

    // Database status endpoint
    this.app.get('/databases', async (req, res) => {
      try {
        const status = {
          sqlite: {
            connected: true,
            path: path.join(__dirname, 'data', 'mcp.db')
          }
        };

        if (this.pgPool) {
          try {
            await this.pgPool.query('SELECT NOW()');
            status.postgresql = {
              connected: true,
              host: process.env.POSTGRES_HOST || 'localhost',
              port: process.env.POSTGRES_PORT || 5432,
              database: process.env.POSTGRES_DB || 'mcp_demo'
            };
          } catch (error) {
            status.postgresql = {
              connected: false,
              error: error.message
            };
          }
        } else {
          status.postgresql = {
            connected: false,
            error: 'PostgreSQL not configured'
          };
        }

        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async executeTool(tool, parameters) {
    switch (tool) {
      case 'pg_set':
        return await this.pgSet(parameters);
      case 'pg_get':
        return await this.pgGet(parameters);
      case 'pg_query':
        return await this.pgQuery(parameters);
      case 'sqlite_set':
        return await this.sqliteSet(parameters);
      case 'sqlite_get':
        return await this.sqliteGet(parameters);
      case 'sqlite_list':
        return await this.sqliteList(parameters);
      case 'db_status':
        return await this.getDbStatus();
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  // PostgreSQL Methods
  async pgSet(params) {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not configured');
    }

    const { key, value } = params;
    
    try {
      await this.pgPool.query(
        `INSERT INTO mcp_data (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
      
      return {
        success: true,
        message: 'Data stored in PostgreSQL',
        key: key,
        database: 'postgresql'
      };
    } catch (error) {
      throw new Error(`PostgreSQL set failed: ${error.message}`);
    }
  }

  async pgGet(params) {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not configured');
    }

    const { key } = params;
    
    try {
      const result = await this.pgPool.query(
        'SELECT value FROM mcp_data WHERE key = $1',
        [key]
      );
      
      return {
        success: true,
        key: key,
        value: result.rows[0]?.value || null,
        found: result.rows.length > 0,
        database: 'postgresql'
      };
    } catch (error) {
      throw new Error(`PostgreSQL get failed: ${error.message}`);
    }
  }

  async pgQuery(params) {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not configured');
    }

    const { query, params: queryParams = [] } = params;
    
    try {
      const result = await this.pgPool.query(query, queryParams);
      
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        database: 'postgresql'
      };
    } catch (error) {
      throw new Error(`PostgreSQL query failed: ${error.message}`);
    }
  }

  // SQLite Methods
  async sqliteSet(params) {
    const { key, value } = params;
    
    return new Promise((resolve, reject) => {
      this.sqlite.run(
        `INSERT OR REPLACE INTO kv_store (key, value, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [key, value],
        function(err) {
          if (err) {
            reject(new Error(`SQLite set failed: ${err.message}`));
          } else {
            resolve({
              success: true,
              message: 'Data stored in SQLite',
              key: key,
              database: 'sqlite'
            });
          }
        }
      );
    });
  }

  async sqliteGet(params) {
    const { key } = params;
    
    return new Promise((resolve, reject) => {
      this.sqlite.get(
        'SELECT value FROM kv_store WHERE key = ?',
        [key],
        (err, row) => {
          if (err) {
            reject(new Error(`SQLite get failed: ${err.message}`));
          } else {
            resolve({
              success: true,
              key: key,
              value: row?.value || null,
              found: !!row,
              database: 'sqlite'
            });
          }
        }
      );
    });
  }

  async sqliteList(params) {
    const { pattern } = params;
    
    return new Promise((resolve, reject) => {
      let query = 'SELECT key FROM kv_store';
      let queryParams = [];
      
      if (pattern) {
        query += ' WHERE key LIKE ?';
        queryParams = [`%${pattern}%`];
      }
      
      this.sqlite.all(query, queryParams, (err, rows) => {
        if (err) {
          reject(new Error(`SQLite list failed: ${err.message}`));
        } else {
          resolve({
            success: true,
            keys: rows.map(row => row.key),
            count: rows.length,
            database: 'sqlite'
          });
        }
      });
    });
  }

  async getDbStatus() {
    const status = {
      sqlite: {
        connected: true,
        path: path.join(__dirname, 'data', 'mcp.db')
      }
    };

    if (this.pgPool) {
      try {
        await this.pgPool.query('SELECT NOW()');
        status.postgresql = {
          connected: true,
          host: process.env.POSTGRES_HOST || 'localhost',
          port: process.env.POSTGRES_PORT || 5432,
          database: process.env.POSTGRES_DB || 'mcp_demo'
        };
      } catch (error) {
        status.postgresql = {
          connected: false,
          error: error.message
        };
      }
    } else {
      status.postgresql = {
        connected: false,
        error: 'PostgreSQL not configured'
      };
    }

    return {
      success: true,
      databases: status
    };
  }

  start() {
    this.app.listen(this.PORT, () => {
      this.logger.info(`MCP Docker Database Server running on port ${this.PORT}`);
      console.log(`
🚀 MCP Docker Database Server Started!
📍 Address: http://localhost:${this.PORT}
🏥 Health: http://localhost:${this.PORT}/health
🔧 Discovery: http://localhost:${this.PORT}/.well-known/mcp
📊 Databases: http://localhost:${this.PORT}/databases

🐳 Docker Integration:
- PostgreSQL: ${this.pgPool ? 'Configured' : 'Not configured'}
- SQLite: Always available

🔗 Claude Integration:
- URL: http://localhost:${this.PORT}
- Type: HTTP
- Authentication: None
      `);
    });
  }

  async close() {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.sqlite) {
      this.sqlite.close();
    }
  }
}

// Start the server
const server = new DockerMCPServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await server.close();
  process.exit(0);
});

module.exports = DockerMCPServer;
