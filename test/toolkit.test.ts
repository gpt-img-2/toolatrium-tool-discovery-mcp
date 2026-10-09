import assert from "node:assert/strict";
import test from "node:test";
import {
  auditAiToolComparison,
  buildAiToolSearchBrief,
  getToolAtriumResources,
  rankAiToolCandidates,
} from "../src/toolkit.js";

test("blocks an incomplete high-sensitivity search brief", () => {
  const result = buildAiToolSearchBrief({
    jobToBeDone: "",
    requiredCapabilities: [],
    deploymentPreference: "self-hosted",
    dataSensitivity: "high",
  });
  assert.equal(result.ready, false);
  assert.equal(result.blockers.length, 3);
});

test("builds an evidence-led search brief", () => {
  const result = buildAiToolSearchBrief({
    jobToBeDone: "Create product demo videos",
    requiredCapabilities: ["Brand templates", "Team review"],
    deploymentPreference: "web",
    dataSensitivity: "medium",
    budget: "Up to USD 50 per month",
  });
  assert.equal(result.ready, true);
  assert.equal(result.searchQueries.length, 3);
  assert.match(result.boundary, /does not search a private database/);
});

test("ranks eligible candidates and keeps hard blockers visible", () => {
  const result = rankAiToolCandidates([
    {
      name: "Candidate A",
      sourceUrl: "https://example.com/a",
      verifiedAt: "2026-10-09",
      useCaseFit: 5,
      capabilityFit: 5,
      workflowFit: 4,
      control: 4,
      privacyConfidence: 4,
      costFit: 4,
      evidenceConfidence: 5,
    },
    {
      name: "Candidate B",
      useCaseFit: 5,
      capabilityFit: 5,
      workflowFit: 5,
      control: 5,
      privacyConfidence: 5,
      costFit: 5,
      evidenceConfidence: 5,
      hardBlockers: ["No required export"],
    },
  ]);
  assert.equal(result.candidates[0]?.name, "Candidate A");
  assert.equal(result.candidates[0]?.score, 91);
  assert.equal(result.candidates[1]?.eligible, false);
  assert.equal(result.candidates[1]?.rank, null);
});

test("requires commercial disclosure and current evidence", () => {
  const result = auditAiToolComparison({
    claims: [
      {
        toolName: "Candidate A",
        claim: "The best free option with unlimited projects",
        evidenceType: "unknown",
      },
    ],
    hasCommercialRelationship: true,
    commercialRelationshipDisclosed: false,
  });
  assert.equal(result.ready, false);
  assert.equal(result.blockers.length, 1);
  assert.ok((result.claims[0]?.warnings.length || 0) >= 3);
});

test("accepts a scoped sourced claim", () => {
  const result = auditAiToolComparison({
    claims: [
      {
        toolName: "Candidate A",
        claim: "The official documentation lists CSV export on the Team plan",
        evidenceType: "official-docs",
        sourceUrl: "https://example.com/docs/export",
        verifiedAt: "2026-10-09",
      },
    ],
    hasCommercialRelationship: false,
    commercialRelationshipDisclosed: false,
  });
  assert.equal(result.ready, true);
  assert.equal(result.claims[0]?.publishable, true);
});

test("resources use the configured origin", () => {
  const result = getToolAtriumResources("https://toolatrium.com", "discover");
  assert.equal(result.length, 3);
  assert.ok(result.every((item) => item.url.startsWith("https://toolatrium.com/")));
});
