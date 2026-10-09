import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { loadConfig } from "./config.js";
import {
  auditAiToolComparison,
  buildAiToolSearchBrief,
  getToolAtriumResources,
  rankAiToolCandidates,
} from "./toolkit.js";

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const instructions = `ToolAtrium Tool Discovery MCP is a deterministic, read-only decision toolkit. Use build_ai_tool_search_brief to define the job and constraints, rank_ai_tool_candidates to calculate transparent scores from user-supplied ratings, audit_ai_tool_comparison to check evidence and disclosure, and get_toolatrium_resources for canonical public pages. Product features, prices, limits, and availability can change and must be verified from current sources. Paid, affiliate, or featured placement is not evidence of product quality. The server does not search private data, fetch third-party sites, access accounts, submit listings, change links, purchase products, or process payments.`;
const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

const rating = z.number().min(0).max(5);

export function createServer() {
  const config = loadConfig();
  const server = new McpServer(
    { name: "toolatrium-tool-discovery-mcp", version: "1.0.0" },
    { instructions },
  );

  server.registerTool(
    "build_ai_tool_search_brief",
    {
      title: "Build an AI tool search brief",
      description:
        "Turn a concrete job, required capabilities, deployment preference, data sensitivity, budget, and constraints into an inspectable search brief.",
      inputSchema: z.object({
        jobToBeDone: z.string().max(1000),
        requiredCapabilities: z.array(z.string().min(1).max(300)).max(20),
        optionalCapabilities: z.array(z.string().min(1).max(300)).max(20).optional(),
        deploymentPreference: z.enum(["web", "desktop", "mobile", "api", "self-hosted", "any"]),
        dataSensitivity: z.enum(["low", "medium", "high"]),
        budget: z.string().max(200).optional(),
        regionOrLanguage: z.string().max(200).optional(),
        teamSize: z.number().int().positive().max(1_000_000).optional(),
        mustAvoid: z.array(z.string().min(1).max(300)).max(20).optional(),
      }),
      annotations,
    },
    async (params) => text(buildAiToolSearchBrief(params)),
  );

  server.registerTool(
    "rank_ai_tool_candidates",
    {
      title: "Rank user-supplied AI tool candidates",
      description:
        "Calculate a transparent evidence-aware score from 0-5 user ratings while keeping hard blockers and missing evidence visible.",
      inputSchema: z.object({
        candidates: z
          .array(
            z.object({
              name: z.string().min(1).max(200),
              sourceUrl: z.string().max(2000).optional(),
              verifiedAt: z.string().max(100).optional(),
              useCaseFit: rating,
              capabilityFit: rating,
              workflowFit: rating,
              control: rating,
              privacyConfidence: rating,
              costFit: rating,
              evidenceConfidence: rating,
              hardBlockers: z.array(z.string().min(1).max(500)).max(20).optional(),
            }),
          )
          .min(1)
          .max(30),
      }),
      annotations,
    },
    async ({ candidates }) => text(rankAiToolCandidates(candidates)),
  );

  server.registerTool(
    "audit_ai_tool_comparison",
    {
      title: "Audit AI tool comparison claims",
      description:
        "Check user-supplied comparison claims for source coverage, verification dates, absolute wording, and commercial disclosure.",
      inputSchema: z.object({
        claims: z
          .array(
            z.object({
              toolName: z.string().min(1).max(200),
              claim: z.string().max(2000),
              evidenceType: z.enum(["official-product-page", "official-docs", "independent-test", "user-report", "unknown"]),
              sourceUrl: z.string().max(2000).optional(),
              verifiedAt: z.string().max(100).optional(),
            }),
          )
          .min(1)
          .max(50),
        hasCommercialRelationship: z.boolean(),
        commercialRelationshipDisclosed: z.boolean(),
      }),
      annotations,
    },
    async (params) => text(auditAiToolComparison(params)),
  );

  server.registerTool(
    "get_toolatrium_resources",
    {
      title: "Get canonical ToolAtrium resources",
      description:
        "Return canonical ToolAtrium discovery, comparison, guide, submission, or policy pages without fetching external content.",
      inputSchema: z.object({
        topic: z
          .enum(["all", "discover", "compare", "guides", "submit", "policy"])
          .default("all"),
      }),
      annotations,
    },
    async ({ topic }) =>
      text({
        topic,
        resources: getToolAtriumResources(config.appBaseUrl, topic),
        rawSkillUrl: `${config.appBaseUrl}/skills/toolatrium-ai-tool-scout/SKILL.md`,
      }),
  );

  return server;
}
