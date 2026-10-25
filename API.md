# Envarith API — early implementation

Base path: `/api`

These endpoints are an early backend foundation. They record policy decisions but do not execute external actions or block an agent runtime. Do not use them as the sole production security boundary.

## Authentication

Authority endpoints require `Authorization: Bearer <API_KEY>`. Configure `ENVARITH_API_KEYS` as a JSON array in the server environment. Each entry has:
```json
[{"key":"a-long-random-secret-at-least-32-characters","tenantId":"provisioned-tenant-uuid","subjectId":"service-account","role":"owner"}]
```
Supported roles: `owner`, `admin`, `governance_lead`, `reviewer`, `auditor`, `viewer`. Use a unique randomly generated secret per service account, restrict Railway variable access, rotate compromised keys, and never put keys in browser code, source control, URLs, or screenshots. The tenant UUID must exist in the database. This initial static-key approach is a bootstrap mechanism; production should use an established identity provider, scoped credentials, key rotation and revocation, audit logging, rate limiting, and tenant provisioning workflow.

The server derives tenant identity from the matched server-side key. It ignores tenant IDs supplied in request bodies for authorization.

## Health

- `GET /health` — process liveness.
- `GET /api/health` — database connectivity check.

## Authority envelopes

- `POST /api/authority/envelopes` — owner/admin/governance lead; create a scoped, expiring envelope.
- `GET /api/authority/envelopes` — tenant-scoped envelope listing.
- `POST /api/authority/envelopes/:id/revoke` — owner/admin; revoke an active envelope and record an evidence event.

Create body example:
```json
{
  "subjectId":"support-agent",
  "accountableOwnerId":"ops-owner",
  "allowedActions":["issue_refund"],
  "prohibitedActions":["delete_account"],
  "allowedResources":["orders"],
  "maxAmount":250,
  "requiredEvidence":["order_record"],
  "requireHumanApprovalFor":[],
  "expiresAt":"2030-01-01T00:00:00.000Z",
  "policyVersion":"policy-v1"
}
```
An empty `allowedResources` array means no resource allowlist is configured; provide an explicit list for sensitive production workflows.

## Decision evaluation

- `POST /api/authority/evaluate` — owner/admin/governance lead/reviewer.
- `requestId` must be unique per tenant. A repeated request ID returns the existing saved decision.
- The endpoint reads the persisted envelope and checks active status, validity, subject, prohibited/allowed actions, resources, amount, required evidence, and human-approval requirement.
- A claimed human approval is not verified by this endpoint and never authorizes external execution by itself.
- Response includes `executionPerformed:false`; no external tool is invoked.

Example body:
```json
{
  "requestId":"req-unique-001",
  "envelopeId":"<envelope-uuid>",
  "subjectId":"support-agent",
  "actionType":"issue_refund",
  "resourceId":"orders",
  "amount":50,
  "evidencePresent":["order_record"]
}
```

## Evidence and accountability graph

- `GET /api/authority/evidence?limit=50` — tenant-scoped evidence events.
- `POST /api/authority/accountability/edges` — owner/admin/governance lead; create/update a relationship.
- `GET /api/authority/accountability/edges` — tenant-scoped relationship listing.

Evidence payload digests and per-tenant hash chaining provide tamper-evidence only if the implementation and trusted checkpoints are protected. They do not prove event truth, and this API does not yet provide an independent verifier or externally anchored checkpoints.

## Not yet production-ready

Before real customer data or runtime enforcement: replace bootstrap static keys with established identity, add key lifecycle management and rate limits, add tenant provisioning, validate and test database constraints, implement approval objects with authenticated approver/scope/expiry, implement a protected execution adapter with idempotency and failure handling, add export/deletion/retention controls, add independent evidence checkpoints/verifier, and perform threat modelling and cross-tenant security testing.
