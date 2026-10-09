# ToolAtrium Tool Discovery MCP

一组确定性、只读的 MCP 工具和 OpenClaw Skill，用于定义 AI 软件需求、以透明权重评估用户提供的候选工具、审核对比声明，并发现 ToolAtrium 官方资源。

本项目不会搜索私有数据、抓取第三方网站、访问账户、提交目录收录、修改外链属性、购买产品或处理付款。产品价格、功能、限制和可用性可能变化，必须从当前来源重新核实。付费、联盟或 Featured 展示不等于产品质量证据。

## 安装

```bash
npx -y github:gpt-img-2/toolatrium-tool-discovery-mcp
```

## 工具

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

Skill 源文件位于 [`openclaw/toolatrium-ai-tool-scout`](openclaw/toolatrium-ai-tool-scout/SKILL.md)。

## 开发

```bash
pnpm install
pnpm validate
```

产品官方资源：[toolatrium.com/llms.txt](https://toolatrium.com/llms.txt)
