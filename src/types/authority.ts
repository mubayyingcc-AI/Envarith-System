export type DecisionOutcome =
  | "PERMIT"
  | "PERMIT_WITH_CONDITIONS"
  | "ESCALATE"
  | "DENY";

export type AuthorityStatus = "ACTIVE" | "REVOKED";

export interface AuthorityEnvelope {
  id: string;
  tenantId: string;
  subjectId: string;
  accountableOwnerId: string;
  allowedActions: string[];
  prohibitedActions: string[];
  allowedResources?: string[];
  maxAmount?: number;
  requiredEvidence: string[];
  requireHumanApprovalFor?: string[];
  issuedAt: string;
  expiresAt: string;
  status: AuthorityStatus;
  policyVersion: string;
}

export interface ProposedAction {
  requestId: string;
  tenantId: string;
  subjectId: string;
  actionType: string;
  resourceId?: string;
  amount?: number;
  evidencePresent: string[];
  humanApprovalGranted?: boolean;
}

export interface AuthorizationDecision {
  outcome: DecisionOutcome;
  reasonCodes: string[];
  explanation: string;
  envelopeId: string;
  requestId: string;
  decidedAt: string;
  requiresServerEnforcement: true;
}

export interface AuthorizationContext {
  now?: Date;
}
