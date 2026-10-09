import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const expectedTools = [
  "build_ai_tool_search_brief",
  "rank_ai_tool_candidates",
  "audit_ai_tool_comparison",
  "get_toolatrium_resources",
];
const command = process.env.MCP_SMOKE_COMMAND || "node";
const args = process.env.MCP_SMOKE_ARGS_JSON
  ? JSON.parse(process.env.MCP_SMOKE_ARGS_JSON)
  : ["bin/toolatrium-tool-discovery-mcp.js"];
const client = new Client({ name: "toolatrium-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({ command, args, cwd: process.cwd() });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);
  assert.deepEqual([...names].sort(), [...expectedTools].sort());
  const result = await client.callTool({
    name: "get_toolatrium_resources",
    arguments: { topic: "discover" },
  });
  const first = result.content?.[0];
  assert.equal(first?.type, "text");
  assert.match(first?.type === "text" ? first.text : "", /toolatrium\.com/);
  console.log(`MCP smoke passed: ${names.join(", ")}`);
} finally {
  await client.close();
}
