export type DeploymentPreference =
  | "web"
  | "desktop"
  | "mobile"
  | "api"
  | "self-hosted"
  | "any";
export type DataSensitivity = "low" | "medium" | "high";
export type ResourceTopic =
  | "all"
  | "discover"
  | "compare"
  | "guides"
  | "submit"
  | "policy";
export type EvidenceType =
  | "official-product-page"
  | "official-docs"
  | "independent-test"
  | "user-report"
  | "unknown";

function clean(value: string | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function cleanList(values: string[] | undefined) {
  return (values || []).map(clean).filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function buildAiToolSearchBrief(params: {
  jobToBeDone: string;
  requiredCapabilities: string[];
  optionalCapabilities?: string[] | undefined;
  deploymentPreference: DeploymentPreference;
  dataSensitivity: DataSensitivity;
  budget?: string | undefined;
  regionOrLanguage?: string | undefined;
  teamSize?: number | undefined;
  mustAvoid?: string[] | undefined;
}) {
  const jobToBeDone = clean(params.jobToBeDone);
  const requiredCapabilities = unique(cleanList(params.requiredCapabilities));
  const optionalCapabilities = unique(cleanList(params.optionalCapabilities));
  const mustAvoid = unique(cleanList(params.mustAvoid));
  const blockers = [
    !jobToBeDone ? "Describe the concrete job the tool must complete." : "",
    requiredCapabilities.length === 0
      ? "Provide at least one required capability."
      : "",
    params.dataSensitivity === "high" && mustAvoid.length === 0
      ? "For high-sensitivity data, define prohibited storage, training, sharing, or deployment behavior."
      : "",
  ].filter(Boolean);

  return {
    ready: blockers.length === 0,
    blockers,
    jobToBeDone,
    requiredCapabilities,
    optionalCapabilities,
    constraints: {
      deploymentPreference: params.deploymentPreference,
      dataSensitivity: params.dataSensitivity,
      budget: clean(params.budget) || "Not specified",
      regionOrLanguage: clean(params.regionOrLanguage) || "Not specified",
      teamSize: params.teamSize ?? "Not specified",
      mustAvoid,
    },
    searchQueries: [
      [jobToBeDone, ...requiredCapabilities.slice(0, 3)].filter(Boolean).join(" "),
      [jobToBeDone, params.deploymentPreference !== "any" ? params.deploymentPreference : "", "pricing"].filter(Boolean).join(" "),
      [jobToBeDone, clean(params.regionOrLanguage), "alternatives"].filter(Boolean).join(" "),
    ].filter(Boolean),
    evidenceChecklist: [
      "Verify required capabilities in current official documentation or a reproducible test.",
      "Record the exact plan, price, limits, currency, billing period, and verification date.",
      "Check export, deletion, ownership, retention, and model-training terms for the intended data.",
      "Test the actual workflow with representative input before adopting the tool.",
      "Separate sponsored or featured placement from evidence of product fit.",
    ],
    boundary:
      "This brief organizes user-supplied requirements. It does not search a private database, access accounts, submit listings, purchase products, or guarantee current product facts.",
  };
}

export type ToolCandidate = {
  name: string;
  sourceUrl?: string | undefined;
  verifiedAt?: string | undefined;
  useCaseFit: number;
  capabilityFit: number;
  workflowFit: number;
  control: number;
  privacyConfidence: number;
  costFit: number;
  evidenceConfidence: number;
  hardBlockers?: string[] | undefined;
};

const weights = {
  useCaseFit: 25,
  capabilityFit: 25,
  workflowFit: 15,
  control: 10,
  privacyConfidence: 10,
  costFit: 10,
  evidenceConfidence: 5,
} as const;

function clampRating(value: number) {
  return Math.min(5, Math.max(0, value));
}

export function rankAiToolCandidates(candidates: ToolCandidate[]) {
  const ranked = candidates.map((candidate) => {
    const ratings = {
      useCaseFit: clampRating(candidate.useCaseFit),
      capabilityFit: clampRating(candidate.capabilityFit),
      workflowFit: clampRating(candidate.workflowFit),
      control: clampRating(candidate.control),
      privacyConfidence: clampRating(candidate.privacyConfidence),
      costFit: clampRating(candidate.costFit),
      evidenceConfidence: clampRating(candidate.evidenceConfidence),
    };
    const hardBlockers = unique(cleanList(candidate.hardBlockers));
    const score = Number(
      (Object.entries(weights) as [keyof typeof weights, number][])
        .reduce((total, [key, weight]) => total + (ratings[key] / 5) * weight, 0)
        .toFixed(1),
    );
    const evidenceWarnings = [
      !clean(candidate.sourceUrl)
        ? "No source URL was supplied."
        : "",
      !clean(candidate.verifiedAt)
        ? "No verification date was supplied."
        : "",
      ratings.evidenceConfidence < 3
        ? "Evidence confidence is below 3/5; treat the score as provisional."
        : "",
    ].filter(Boolean);
    return {
      name: clean(candidate.name),
      eligible: hardBlockers.length === 0,
      score: hardBlockers.length === 0 ? score : null,
      ratings,
      hardBlockers,
      evidenceWarnings,
      sourceUrl: clean(candidate.sourceUrl) || null,
      verifiedAt: clean(candidate.verifiedAt) || null,
    };
  });

  ranked.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return (b.score ?? -1) - (a.score ?? -1) || a.name.localeCompare(b.name);
  });

  return {
    weights,
    candidates: ranked.map((candidate, index) => ({
      rank: candidate.eligible ? index + 1 : null,
      ...candidate,
    })),
    interpretation:
      "Scores are a transparent calculation from user-supplied ratings, not ToolAtrium product endorsements or independently verified facts.",
  };
}

const timeSensitiveTerms =
  /\b(price|pricing|cost|free|discount|trial|available|availability|supported|version|limit|unlimited|retention)\b/i;
const superlativeTerms =
  /\b(best|perfect|guaranteed|always|never|unlimited|number one|#1)\b/i;

export function auditAiToolComparison(params: {
  claims: Array<{
    toolName: string;
    claim: string;
    evidenceType: EvidenceType;
    sourceUrl?: string | undefined;
    verifiedAt?: string | undefined;
  }>;
  hasCommercialRelationship: boolean;
  commercialRelationshipDisclosed: boolean;
}) {
  const blockers = [
    params.hasCommercialRelationship && !params.commercialRelationshipDisclosed
      ? "Disclose the commercial, affiliate, sponsored, or featured relationship before publishing the comparison."
      : "",
  ].filter(Boolean);
  const claims = params.claims.map((item, index) => {
    const claim = clean(item.claim);
    const sourceUrl = clean(item.sourceUrl);
    const verifiedAt = clean(item.verifiedAt);
    const warnings = [
      !claim ? "The claim is empty." : "",
      item.evidenceType === "unknown"
        ? "The evidence type is unknown."
        : "",
      !sourceUrl ? "Add a source URL or mark the statement as unverified." : "",
      timeSensitiveTerms.test(claim) && !verifiedAt
        ? "This claim can change over time; add a verification date."
        : "",
      superlativeTerms.test(claim)
        ? "The wording uses a superlative or absolute; narrow it to the tested scope and evidence."
        : "",
    ].filter(Boolean);
    return {
      claim: index + 1,
      toolName: clean(item.toolName),
      statement: claim,
      evidenceType: item.evidenceType,
      sourceUrl: sourceUrl || null,
      verifiedAt: verifiedAt || null,
      warnings: unique(warnings),
      publishable: claim.length > 0 && warnings.length === 0,
    };
  });

  return {
    ready: blockers.length === 0 && claims.every((claim) => claim.publishable),
    blockers,
    claims,
    editorialBoundary:
      "A directory listing, paid submission, affiliate relationship, or featured placement is not evidence that a tool is objectively better. Verify each material claim in its stated scope.",
  };
}

const resources = [
  {
    topic: "discover",
    title: "Explore AI Tools",
    path: "/explore",
    purpose: "Browse the current public ToolAtrium directory.",
  },
  {
    topic: "discover",
    title: "Best AI SaaS Tools",
    path: "/best/ai-saas-tools",
    purpose: "Start with workflow-led AI SaaS selection criteria.",
  },
  {
    topic: "discover",
    title: "Best AI Coding Tools",
    path: "/best/ai-coding-tools",
    purpose: "Review coding-tool use cases and selection criteria.",
  },
  {
    topic: "compare",
    title: "Lovable Alternatives",
    path: "/alternatives/lovable",
    purpose: "Review a current alternatives-page structure.",
  },
  {
    topic: "compare",
    title: "Lovable vs Bolt",
    path: "/compare/lovable-vs-bolt",
    purpose: "Review an evidence-bounded comparison structure.",
  },
  {
    topic: "guides",
    title: "ToolAtrium Insights",
    path: "/blog",
    purpose: "Read public tool-selection and workflow guides.",
  },
  {
    topic: "guides",
    title: "Open-source AI Tools",
    path: "/open-source",
    purpose: "Browse tools listed with open-source context.",
  },
  {
    topic: "submit",
    title: "Submit a Tool",
    path: "/submit",
    purpose: "Review the current public submission options and terms.",
  },
  {
    topic: "policy",
    title: "About ToolAtrium",
    path: "/about",
    purpose: "Read the independent directory and editorial positioning.",
  },
  {
    topic: "policy",
    title: "Privacy Policy",
    path: "/privacy-policy",
    purpose: "Review current data-handling terms.",
  },
  {
    topic: "policy",
    title: "Terms of Service",
    path: "/terms-of-service",
    purpose: "Review current usage and submission terms.",
  },
] as const;

export function getToolAtriumResources(
  appBaseUrl: string,
  topic: ResourceTopic,
) {
  return resources
    .filter((item) => topic === "all" || item.topic === topic)
    .map((item) => ({ ...item, url: `${appBaseUrl}${item.path}` }));
}
