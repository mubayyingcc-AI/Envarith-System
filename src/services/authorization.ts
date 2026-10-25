import type {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorityEnvelope,
  ProposedAction,
} from "../types/authority";

function decision(
  request: ProposedAction,
  envelope: AuthorityEnvelope,
  outcome: AuthorizationDecision["outcome"],
  reasonCodes: string[],
  explanation: string,
  now: Date,
): AuthorizationDecision {
  return {
    outcome,
    reasonCodes,
    explanation,
    envelopeId: envelope.id,
    requestId: request.requestId,
    decidedAt: now.toISOString(),
    requiresServerEnforcement: true,
  };
}

/**
 * Deterministic reference evaluator for the Envarith prototype.
 *
 * This function is not a production security boundary by itself. Production
 * integrations must authenticate identities, load authoritative policy and
 * revocation state server-side, and re-check authorization immediately before
 * a protected tool executes.
 */
export function evaluateAuthority(
  request: ProposedAction,
  envelope: AuthorityEnvelope,
  context: AuthorizationContext = {},
): AuthorizationDecision {
  const now = context.now ?? new Date();

  if (
    !request.requestId ||
    !request.tenantId ||
    !request.subjectId ||
    !request.actionType ||
    !envelope.id ||
    !envelope.tenantId ||
    !envelope.subjectId ||
    !envelope.accountableOwnerId ||
    !envelope.policyVersion
  ) {
    return decision(
      request,
      envelope,
      "DENY",
      ["MALFORMED_AUTHORITY_CONTEXT"],
      "Required identity or authority fields are missing.",
      now,
    );
  }

  if (request.tenantId !== envelope.tenantId) {
    return decision(
      request,
      envelope,
      "DENY",
      ["TENANT_MISMATCH"],
      "The request and authority envelope belong to different tenants.",
      now,
    );
  }

  if (request.subjectId !== envelope.subjectId) {
    return decision(
      request,
      envelope,
      "DENY",
      ["SUBJECT_MISMATCH"],
      "This authority envelope was not issued to the requesting subject.",
      now,
    );
  }

  if (envelope.status !== "ACTIVE") {
    return decision(
      request,
      envelope,
      "DENY",
      ["AUTHORITY_NOT_ACTIVE"],
      "The authority envelope is revoked or not active.",
      now,
    );
  }

  const issuedAt = Date.parse(envelope.issuedAt);
  const expiresAt = Date.parse(envelope.expiresAt);
  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    issuedAt > now.getTime() ||
    expiresAt <= now.getTime() ||
    expiresAt <= issuedAt
  ) {
    return decision(
      request,
      envelope,
      "DENY",
      ["AUTHORITY_OUTSIDE_VALIDITY_WINDOW"],
      "The authority envelope has an invalid or expired validity window.",
      now,
    );
  }

  if (envelope.prohibitedActions.includes(request.actionType)) {
    return decision(
      request,
      envelope,
      "DENY",
      ["ACTION_EXPLICITLY_PROHIBITED"],
      "The requested action is explicitly prohibited by the authority envelope.",
      now,
    );
  }

  if (!envelope.allowedActions.includes(request.actionType)) {
    return decision(
      request,
      envelope,
      "DENY",
      ["ACTION_OUTSIDE_SCOPE"],
      "The requested action is not included in the authorized action scope.",
      now,
    );
  }

  if (
    envelope.allowedResources &&
    (!request.resourceId || !envelope.allowedResources.includes(request.resourceId))
  ) {
    return decision(
      request,
      envelope,
      "DENY",
      ["RESOURCE_OUTSIDE_SCOPE"],
      "The target resource is missing or outside the authorized resource scope.",
      now,
    );
  }

  if (request.amount !== undefined && (!Number.isFinite(request.amount) || request.amount < 0)) {
    return decision(
      request,
      envelope,
      "DENY",
      ["INVALID_AMOUNT"],
      "The requested amount must be a finite, non-negative number.",
      now,
    );
  }

  if (
    envelope.maxAmount !== undefined &&
    request.amount === undefined &&
    /(refund|payment|transfer|purchase|payout|charge|withdraw|credit)/i.test(request.actionType)
  ) {
    return decision(
      request,
      envelope,
      "ESCALATE",
      ["AMOUNT_REQUIRED_FOR_FINANCIAL_ACTION"],
      "A financial action with an amount limit must include the requested amount.",
      now,
    );
  }

  if (
    envelope.maxAmount !== undefined &&
    request.amount !== undefined &&
    request.amount > envelope.maxAmount
  ) {
    return decision(
      request,
      envelope,
      "ESCALATE",
      ["AMOUNT_LIMIT_EXCEEDED"],
      "The request exceeds the envelope's amount limit and requires authorized review.",
      now,
    );
  }

  const missingEvidence = envelope.requiredEvidence.filter(
    (item) => !request.evidencePresent.includes(item),
  );
  if (missingEvidence.length > 0) {
    return decision(
      request,
      envelope,
      "ESCALATE",
      ["REQUIRED_EVIDENCE_MISSING"],
      `Required evidence is missing: ${missingEvidence.join(", ")}.`,
      now,
    );
  }

  if (envelope.requireHumanApprovalFor?.includes(request.actionType)) {
    if (request.humanApprovalGranted !== true) {
      return decision(
        request,
        envelope,
        "ESCALATE",
        ["HUMAN_APPROVAL_REQUIRED"],
        "This action requires an authorized human approval before execution.",
        now,
      );
    }

    return decision(
      request,
      envelope,
      "PERMIT_WITH_CONDITIONS",
      ["HUMAN_APPROVAL_RECORDED"],
      "The approval condition is marked satisfied; production must verify the approval's identity, scope, and freshness server-side.",
      now,
    );
  }

  return decision(
    request,
    envelope,
    "PERMIT",
    ["AUTHORITY_CHECKS_PASSED"],
    "The request passed the reference envelope checks. A protected server-side adapter must enforce this decision before execution.",
    now,
  );
}
