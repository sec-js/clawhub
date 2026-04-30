/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  AGENTIC_RISK_CATEGORIES,
  CLAWSCAN_RISK_BUCKETS,
  SAFETEST_SUPPORTING_LENSES,
  assembleSkillEvalUserMessage,
  parseLlmEvalResponse,
  SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT,
  type SkillEvalContext,
} from "./securityPrompt";

const baseCtx: SkillEvalContext = {
  slug: "wallet-sync",
  displayName: "Wallet Sync",
  ownerUserId: "users:1",
  version: "1.0.0",
  createdAt: Date.UTC(2026, 0, 1),
  summary: "Syncs wallet balances to a dashboard.",
  source: "https://github.com/example/wallet-sync",
  homepage: "https://example.com",
  parsed: {
    frontmatter: {
      description: "Syncs wallet balances to a dashboard.",
    },
    metadata: {},
    clawdis: {
      requires: {
        env: ["WALLET_API_KEY"],
      },
    },
  },
  files: [
    { path: "SKILL.md", size: 1200 },
    { path: "index.ts", size: 900 },
  ],
  skillMdContent: "# Wallet Sync\n\nUse WALLET_API_KEY to fetch balances.",
  fileContents: [{ path: "index.ts", content: "fetch('https://api.example.com/balances')" }],
  injectionSignals: [],
  staticScan: {
    status: "suspicious",
    reasonCodes: ["suspicious.env_credential_access"],
    findings: [
      {
        code: "suspicious.env_credential_access",
        severity: "warn",
        file: "SKILL.md",
        line: 3,
        message: "Credential-like environment variable access.",
        evidence: "WALLET_API_KEY",
      },
    ],
    summary: "Static analysis found credential access.",
    engineVersion: "test",
    checkedAt: Date.UTC(2026, 0, 2),
  },
  capabilityTags: ["requires-sensitive-credentials", "posts-externally"],
};

function newResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    verdict: "suspicious",
    confidence: "medium",
    summary: "The skill is mostly aligned but uses sensitive wallet credentials.",
    dimensions: {
      purpose_capability: { status: "note", detail: "Wallet credentials fit the purpose." },
    },
    scan_findings_in_context: [
      {
        ruleId: "suspicious.env_credential_access",
        expected_for_purpose: true,
        note: "Wallet sync needs the declared wallet API key.",
      },
    ],
    agentic_risk_findings: [
      {
        category_id: "ASI03",
        category_label: "Identity and Privilege Abuse",
        risk_bucket: "permission_boundary",
        supporting_lens: "permission-boundary",
        status: "note",
        severity: "medium",
        confidence: "medium",
        evidence: {
          path: "SKILL.md",
          snippet: "Use WALLET_API_KEY",
          explanation: "The skill handles a wallet credential.",
        },
        user_impact: "Users should know this skill needs wallet-scoped access.",
        recommendation: "Use a least-privilege wallet API key.",
      },
      {
        category_id: "ASI09",
        category_label: "Human-Agent Trust Exploitation",
        risk_bucket: "abnormal_behavior_control",
        status: "none",
        severity: "none",
        confidence: "high",
        user_impact: "No artifact-backed trust exploitation was found.",
        recommendation: "No action needed.",
      },
    ],
    risk_summary: {
      abnormal_behavior_control: {
        status: "none",
        highest_severity: "none",
        summary: "No abnormal behavior control issue is evidenced.",
      },
      permission_boundary: {
        status: "note",
        highest_severity: "medium",
        summary: "Wallet credential access is purpose-aligned but sensitive.",
      },
      sensitive_data_protection: {
        status: "note",
        highest_severity: "medium",
        summary: "Users should keep the wallet API key scoped.",
      },
    },
    user_guidance: "Review the wallet credential scope before installing.",
    ...overrides,
  });
}

describe("securityPrompt", () => {
  it("parses legacy ClawScan responses without agentic fields", () => {
    const parsed = parseLlmEvalResponse(
      JSON.stringify({
        verdict: "benign",
        confidence: "high",
        summary: "The skill is coherent.",
        dimensions: {
          purpose_capability: { status: "ok", detail: "Purpose and requirements align." },
        },
        user_guidance: "Looks proportionate.",
      }),
    );

    expect(parsed).toMatchObject({
      verdict: "benign",
      confidence: "high",
      summary: "The skill is coherent.",
      guidance: "Looks proportionate.",
    });
    expect(parsed?.agenticRiskFindings).toBeUndefined();
    expect(parsed?.riskSummary).toBeUndefined();
  });

  it("parses SkillTester ASI findings and the three-bucket risk summary", () => {
    const parsed = parseLlmEvalResponse(newResponse());

    expect(parsed?.agenticRiskFindings?.[0]).toMatchObject({
      categoryId: "ASI03",
      categoryLabel: "Identity and Privilege Abuse",
      riskBucket: "permission_boundary",
      supportingLens: "permission-boundary",
      status: "note",
      evidence: {
        path: "SKILL.md",
        snippet: "Use WALLET_API_KEY",
      },
    });
    expect(Object.keys(parsed?.riskSummary ?? {})).toEqual([
      "abnormal_behavior_control",
      "permission_boundary",
      "sensitive_data_protection",
    ]);
  });

  it("rejects note and concern findings without concrete evidence", () => {
    const parsed = parseLlmEvalResponse(
      newResponse({
        agentic_risk_findings: [
          {
            category_id: "ASI05",
            category_label: "Unexpected Code Execution",
            risk_bucket: "abnormal_behavior_control",
            status: "concern",
            severity: "high",
            confidence: "high",
            evidence: { path: "SKILL.md", snippet: "", explanation: "Empty snippet." },
            user_impact: "Commands could run unexpectedly.",
            recommendation: "Remove unsupported command execution.",
          },
        ],
      }),
    );

    expect(parsed).toBeNull();
  });

  it("documents ASI coverage, SafeTest lenses, ClawScan buckets, and runtime-claim prohibitions", () => {
    for (const category of AGENTIC_RISK_CATEGORIES) {
      expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain(category.id);
      expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain(category.label);
    }
    for (const bucket of CLAWSCAN_RISK_BUCKETS) {
      expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain(bucket);
    }
    for (const lens of SAFETEST_SUPPORTING_LENSES) {
      expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain(lens);
    }
    expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain("Do not execute code");
    expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain("not assessable without execution");
    expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain("Do not use Agent Audit");
    expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain("purpose-aligned");
    expect(SKILL_SECURITY_EVALUATOR_SYSTEM_PROMPT).toContain("purpose-mismatched");
  });

  it("includes static scan and capability signals in skill eval input", () => {
    const message = assembleSkillEvalUserMessage(baseCtx);

    expect(message).toContain("### Static scan signals");
    expect(message).toContain("suspicious.env_credential_access");
    expect(message).toContain("WALLET_API_KEY");
    expect(message).toContain("### Capability signals");
    expect(message).toContain("requires-sensitive-credentials");
    expect(message).toContain("posts-externally");
  });
});
