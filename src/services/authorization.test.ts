import { describe, expect, it } from "vitest";
import { evaluateAuthority } from "./authorization";
import type { AuthorityEnvelope, ProposedAction } from "../types/authority";

const fixedNow = new Date("2026-10-23T10:00:00.000Z");

const envelope: AuthorityEnvelope = {
  id: "gae-test-001",
  tenantId: "tenant-a",
  subjectId: "agent-refunds",
  accountableOwnerId: "owner-ops",
  allowedActions: ["issue_refund", "send_template_email"],
  prohibitedActions: ["delete_account"],
  allowedResources: ["order-123"],
  maxAmount: 500,
  requiredEvidence: ["order_record"],
  requireHumanApprovalFor: ["send_template_email"],
  issuedAt: "2026-10-23T09:00:00.000Z",
  expiresAt: "2026-10-23T12:00:00.000Z",
  status: "ACTIVE",
  policyVersion: "policy-v1",
};

const request: ProposedAction = {
  requestId: "request-001",
  tenantId: "tenant-a",
  subjectId: "agent-refunds",
  actionType: "issue_refund",
  resourceId: "order-123",
  amount: 250,
  evidencePresent: ["order_record"],
};

describe("evaluateAuthority", () => {
  it("permits an in-scope request when required evidence is present", () => {
    expect(evaluateAuthority(request, envelope, { now: fixedNow }).outcome).toBe("PERMIT");
  });

  it("denies an explicitly prohibited action", () => {
    const result = evaluateAuthority(
      { ...request, actionType: "delete_account" },
      envelope,
      { now: fixedNow },
    );
    expect(result.outcome).toBe("DENY");
    expect(result.reasonCodes).toContain("ACTION_EXPLICITLY_PROHIBITED");
  });

  it("denies a cross-tenant request", () => {
    const result = evaluateAuthority(
      { ...request, tenantId: "tenant-b" },
      envelope,
      { now: fixedNow },
    );
    expect(result.outcome).toBe("DENY");
    expect(result.reasonCodes).toContain("TENANT_MISMATCH");
  });

  it("escalates when the amount exceeds the limit", () => {
    const result = evaluateAuthority(
      { ...request, amount: 750 },
      envelope,
      { now: fixedNow },
    );
    expect(result.outcome).toBe("ESCALATE");
    expect(result.reasonCodes).toContain("AMOUNT_LIMIT_EXCEEDED");
  });

  it("escalates a financial action when the envelope has an amount limit but the amount is missing", () => {
    const result = evaluateAuthority(
      { ...request, amount: undefined },
      envelope,
      { now: fixedNow },
    );
    expect(result.outcome).toBe("ESCALATE");
    expect(result.reasonCodes).toContain("AMOUNT_REQUIRED_FOR_FINANCIAL_ACTION");
  });

  it("escalates when required evidence is missing", () => {
    const result = evaluateAuthority(
      { ...request, evidencePresent: [] },
      envelope,
      { now: fixedNow },
    );
    expect(result.outcome).toBe("ESCALATE");
    expect(result.reasonCodes).toContain("REQUIRED_EVIDENCE_MISSING");
  });

  it("denies an expired envelope", () => {
    const result = evaluateAuthority(request, envelope, {
      now: new Date("2026-10-23T13:00:00.000Z"),
    });
    expect(result.outcome).toBe("DENY");
    expect(result.reasonCodes).toContain("AUTHORITY_OUTSIDE_VALIDITY_WINDOW");
  });

  it("escalates actions that require human approval", () => {
    const result = evaluateAuthority(
      { ...request, actionType: "send_template_email" },
      envelope,
      { now: fixedNow },
    );
    expect(result.outcome).toBe("ESCALATE");
    expect(result.reasonCodes).toContain("HUMAN_APPROVAL_REQUIRED");
  });

  it("marks a human-approved action as conditional permit", () => {
    const result = evaluateAuthority(
      { ...request, actionType: "send_template_email", humanApprovalGranted: true },
      envelope,
      { now: fixedNow },
    );
    expect(result.outcome).toBe("PERMIT_WITH_CONDITIONS");
  });

  it("denies a revoked envelope", () => {
    const result = evaluateAuthority(
      request,
      { ...envelope, status: "REVOKED" },
      { now: fixedNow },
    );
    expect(result.outcome).toBe("DENY");
    expect(result.reasonCodes).toContain("AUTHORITY_NOT_ACTIVE");
  });
});
