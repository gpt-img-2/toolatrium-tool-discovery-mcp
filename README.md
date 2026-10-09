# ToolAtrium Tool Discovery MCP

Deterministic, read-only MCP tools and an OpenClaw Skill for defining AI software requirements, ranking user-supplied candidates with transparent weights, auditing comparison claims, and discovering canonical ToolAtrium resources.

This project does not search private data, fetch third-party sites, access accounts, submit directory listings, change external-link attributes, purchase products, or process payments. Product prices, features, limits, and availability can change and must be verified from current sources. Paid, affiliate, or featured placement is not evidence of product quality.

## Install

```bash
npx -y github:gpt-img-2/toolatrium-tool-discovery-mcp
```

## Tools

- `build_ai_tool_search_brief`
- `rank_ai_tool_candidates`
- `audit_ai_tool_comparison`
- `get_toolatrium_resources`

## OpenClaw

```bash
openclaw mcp add toolatrium \
  --command npx \
  --arg -y \
  --arg github:gpt-img-2/toolatrium-tool-discovery-mcp
```

The Skill source is in [`openclaw/toolatrium-ai-tool-scout`](openclaw/toolatrium-ai-tool-scout/SKILL.md).

## Development

```bash
pnpm install
pnpm validate
```

Canonical product resources: [toolatrium.com/llms.txt](https://toolatrium.com/llms.txt)
