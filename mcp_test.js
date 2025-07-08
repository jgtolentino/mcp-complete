import fetch from "node-fetch";

const BASE_URL = "https://mcp-complete.onrender.com";

async function test() {
  try {
    // Test health endpoint
    let res = await fetch(`${BASE_URL}/health`);
    console.log("/health status:", res.status);
    console.log(await res.text());

    // Test MCP discovery endpoint
    res = await fetch(`${BASE_URL}/.well-known/mcp`);
    console.log("/.well-known/mcp status:", res.status);
    const mcpJson = await res.json();
    console.log("MCP tools available:", mcpJson.tools.map(t => t.name));

    // Test sqlite_set and sqlite_get
    const key = "test_key";
    const value = "test_value";

    // sqlite_set (using correct endpoint)
    res = await fetch(`${BASE_URL}/mcp/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        tool: "sqlite_set",
        parameters: { key, value }
      }),
    });
    console.log("sqlite_set status:", res.status);
    console.log(await res.text());

    // sqlite_get (using correct endpoint)
    res = await fetch(`${BASE_URL}/mcp/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        tool: "sqlite_get",
        parameters: { key }
      }),
    });
    console.log("sqlite_get status:", res.status);
    console.log(await res.text());
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();