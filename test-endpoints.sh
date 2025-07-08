#!/bin/bash

BASE_URL="https://mcp-complete.onrender.com"

echo "🧪 Testing MCP Server at: $BASE_URL"
echo "=================================================="

# Test 1: Health endpoint
echo -e "\n1️⃣ Testing Health Endpoint..."
curl -i "$BASE_URL/health"

# Test 2: MCP Discovery endpoint
echo -e "\n\n2️⃣ Testing MCP Discovery Endpoint..."
curl -i "$BASE_URL/.well-known/mcp"

# Test 3: MCP Tool - sqlite_set
echo -e "\n\n3️⃣ Testing sqlite_set..."
RESPONSE=$(curl -s -X POST "$BASE_URL/mcp/call" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sqlite_set",
    "parameters": {
      "key": "test_key_bash",
      "value": "Hello from bash test!"
    }
  }')
echo "Response: $RESPONSE"

# Test 4: MCP Tool - sqlite_get
echo -e "\n4️⃣ Testing sqlite_get..."
curl -X POST "$BASE_URL/mcp/call" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sqlite_get",
    "parameters": {
      "key": "test_key_bash"
    }
  }' | jq

# Test 5: MCP Tool - sqlite_list
echo -e "\n5️⃣ Testing sqlite_list..."
curl -X POST "$BASE_URL/mcp/call" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sqlite_list",
    "parameters": {
      "pattern": "test_%"
    }
  }' | jq

echo -e "\n=================================================="
echo "✅ Tests complete! Check the output above."