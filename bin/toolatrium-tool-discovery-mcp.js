#!/usr/bin/env node

import("../dist/index.js").catch((error) => {
  console.error("ToolAtrium Tool Discovery MCP failed to start:", error);
  process.exit(1);
});
