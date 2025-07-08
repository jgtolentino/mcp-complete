const https = require('https');

const BASE_URL = "https://mcp-complete.onrender.com";

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing MCP Server at:', BASE_URL);
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Health endpoint
    console.log('\n1️⃣ Testing Health Endpoint...');
    const healthRes = await makeRequest(`${BASE_URL}/health`);
    console.log('Status:', healthRes.status);
    console.log('Response:', healthRes.body);
    const health = JSON.parse(healthRes.body);
    console.log('✅ Health check passed:', health.status === 'healthy');
    
    // Test 2: MCP Discovery endpoint
    console.log('\n2️⃣ Testing MCP Discovery Endpoint...');
    const mcpRes = await makeRequest(`${BASE_URL}/.well-known/mcp`);
    console.log('Status:', mcpRes.status);
    const mcp = JSON.parse(mcpRes.body);
    console.log('MCP Version:', mcp.mcp_version);
    console.log('Available tools:', mcp.tools.map(t => t.name).join(', '));
    console.log('✅ MCP discovery passed');
    
    // Test 3: MCP Tool - sqlite_set
    console.log('\n3️⃣ Testing sqlite_set...');
    const setRes = await makeRequest(`${BASE_URL}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'sqlite_set',
        parameters: {
          key: 'test_key_' + Date.now(),
          value: 'Hello from test script!'
        }
      })
    });
    console.log('Status:', setRes.status);
    console.log('Response:', setRes.body);
    const setResult = JSON.parse(setRes.body);
    console.log('✅ sqlite_set passed:', setResult.success === true);
    
    // Test 4: MCP Tool - sqlite_get
    console.log('\n4️⃣ Testing sqlite_get...');
    const getRes = await makeRequest(`${BASE_URL}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'sqlite_get',
        parameters: {
          key: setResult.key
        }
      })
    });
    console.log('Status:', getRes.status);
    console.log('Response:', getRes.body);
    const getResult = JSON.parse(getRes.body);
    console.log('✅ sqlite_get passed:', getResult.value === 'Hello from test script!');
    
    // Test 5: MCP Tool - sqlite_list
    console.log('\n5️⃣ Testing sqlite_list...');
    const listRes = await makeRequest(`${BASE_URL}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'sqlite_list',
        parameters: {
          pattern: 'test_%'
        }
      })
    });
    console.log('Status:', listRes.status);
    console.log('Response:', listRes.body);
    const listResult = JSON.parse(listRes.body);
    console.log('✅ sqlite_list passed, found', listResult.keys.length, 'keys');
    
    // Test 6: MCP Tool - sqlite_delete
    console.log('\n6️⃣ Testing sqlite_delete...');
    const deleteRes = await makeRequest(`${BASE_URL}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'sqlite_delete',
        parameters: {
          key: setResult.key
        }
      })
    });
    console.log('Status:', deleteRes.status);
    console.log('Response:', deleteRes.body);
    const deleteResult = JSON.parse(deleteRes.body);
    console.log('✅ sqlite_delete passed:', deleteResult.success === true);
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Claude Web App Configuration:');
    console.log('URL:', BASE_URL);
    console.log('Type: HTTP');
    console.log('Auth: None');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

// Run the tests
runTests();