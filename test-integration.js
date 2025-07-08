// Quick MCP Integration Test
const http = require('http');

async function testMCPServer() {
    console.log('🧪 Testing MCP Server Integration...');
    
    const baseUrl = 'http://localhost:10000';
    const tests = [
        { name: 'Health Check', path: '/health' },
        { name: 'MCP Discovery', path: '/.well-known/mcp' }
    ];
    
    for (const test of tests) {
        try {
            const response = await fetch(`${baseUrl}${test.path}`);
            const data = await response.json();
            console.log(`✅ ${test.name}: ${response.status} OK`);
            console.log(JSON.stringify(data, null, 2));
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
        }
    }
    
    // Test MCP tool call
    try {
        const response = await fetch(`${baseUrl}/mcp/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool: 'sqlite_set',
                parameters: {
                    key: 'claude_integration_test',
                    value: 'Hello from Claude!'
                }
            })
        });
        
        const data = await response.json();
        console.log('✅ MCP Tool Call: Success');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.log(`❌ MCP Tool Call: ${error.message}`);
    }
    
    console.log('\n🎯 If all tests pass, your server is ready for Claude Web App!');
}

testMCPServer().catch(console.error);
