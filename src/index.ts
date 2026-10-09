import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

serveStdio(() => createServer(), {
  onerror: (error) => console.error("ToolAtrium Tool Discovery MCP error:", error),
});
