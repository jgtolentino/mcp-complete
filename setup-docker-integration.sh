#!/bin/bash

# MCP Docker Database Integration Setup

set -e

echo "🐳 Setting up MCP with Docker PostgreSQL..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Navigate to the PostgreSQL Docker setup
cd /Users/tbwa/Documents/GitHub/mcp-postgres-docker

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is responding
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL failed to start"
    exit 1
fi

# Navigate to MCP setup
cd /Users/tbwa/Documents/GitHub/mcp-complete-setup

# Create environment file for Docker integration
cat > .env.docker << 'EOF'
# Docker PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mcp_demo

# MCP Server Configuration
PORT=10000
LOG_LEVEL=info
EOF

# Install PostgreSQL client library
echo "📦 Installing PostgreSQL support..."
npm install pg

# Create the Docker-enabled MCP server
echo "🔧 Setting up Docker-enabled MCP server..."

# Test the connection
echo "🧪 Testing database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mcp_demo',
  password: 'postgres',
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ PostgreSQL connection successful');
    console.log('🕐 Server time:', res.rows[0].now);
    process.exit(0);
  }
});
"

echo ""
echo "🎉 Docker PostgreSQL integration setup complete!"
echo ""
echo "📊 Available databases:"
echo "  - PostgreSQL: localhost:5432 (Docker container)"
echo "  - SQLite: Local file storage"
echo ""
echo "🚀 To start the enhanced MCP server:"
echo "  source .env.docker"
echo "  node docker-mcp-server.js"
echo ""
echo "🔗 Claude Web App configuration:"
echo "  URL: http://localhost:10000"
echo "  Type: HTTP"
echo "  Auth: None"
echo ""
echo "🛠️ Available tools:"
echo "  - pg_set, pg_get, pg_query, pg_list (PostgreSQL)"
echo "  - sqlite_set, sqlite_get (SQLite fallback)"
echo "  - db_status (Database connection status)"
echo ""
echo "📋 To access pgAdmin:"
echo "  http://localhost:5050"
echo "  Email: admin@tbwa.com"
echo "  Password: admin"
