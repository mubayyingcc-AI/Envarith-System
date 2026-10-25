# Envarith API — prototype implementation

Base path: `/api`

The API persists authority envelopes, evaluates proposed actions, records decisions and evidence, supports revocation, and stores accountability graph edges. **It does not execute external actions and is not yet a production security boundary.** A `PERMIT` response must not be treated as permission to execute unless a trusted runtime adapter rechecks the decision and enforces it immediately before execution.

## Authentication

Authority endpoints require `Authorization: Bearer <API_KEY>`. Configure `ENVARITH_API_KEYS` as a JSON array in the server environment:

```json
[{"key":"a-long-random-secret-at-least-32-characters","tenantId":"provisioned-tenant-uuid","subjectId":"service-account","role":"owner"}]
```

Supported roles: `owner`, `admin`, `governance_lead`, `reviewer`, `auditor`, `viewer`. The tenant ID is derived from the matching server-side credential, not trusted from the request. The tenant UUID must already exist in the database.

This is bootstrap static-key authentication, not production identity. Before customer rollout, add an established identity provider, credential lifecycle/rotation/revocation, scoped credentials, rate limiting, tenant provisioning, security monitoring, and cross-tenant penetration tests. Never put keys in browser code, source control, URLs, or screenshots.

## Health

- `GET /health` — process liveness.
- `GET /api/health` — database connectivity.

## Authority envelopes

- `POST /api/authority/envelopes` — owner/admin/governance lead; create a scoped, expiring envelope.
- `GET /api/authority/envelopes` — tenant-scoped envelope listing.
- `POST /api/authority/envelopes/:id/revoke` — owner/admin; revoke an active envelope and record an evidence event.

Example create body:

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

An empty `allowedResources` array means no resource allowlist is configured. Sensitive workflows should provide an explicit allowlist.

## Decision evaluation

- `POST /api/authority/evaluate` — owner/admin/governance lead/reviewer.
- `requestId` is an idempotency key scoped to a tenant. An identical request replay returns the stored decision. Reusing the same ID with different request inputs returns `409 Conflict`; issue a new ID for a new evaluation.
- The endpoint loads the persisted envelope and checks its status and validity, subject, prohibited/allowed actions, resource scope, amount, required evidence, and approval requirement.
- Financial action names with a configured amount limit cannot omit the amount and receive a permit.
- A client-supplied claim that a human approved an action is not an authenticated approval record. If human approval is required, the API escalates; an authenticated approval object/workflow remains to be implemented.
- Responses include `executionPerformed:false`. No external tool is invoked.

Example:

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

- `GET /api/authority/evidence?limit=50` — tenant-scoped recent evidence events.
- `GET /api/authority/evidence/verify` — owner/admin/governance lead/auditor; checks stored payload digests, event hashes, and per-tenant chain continuity.
- `POST /api/authority/accountability/edges` — owner/admin/governance lead; create/update a relationship.
- `GET /api/authority/accountability/edges` — tenant-scoped relationship listing.

The verifier checks the stored chain; it does not prove event truth or protect against an administrator rewriting the entire database and recomputing every hash. Stronger independent assurance requires externally anchored signed checkpoints or exports, protected signing keys, and a separate verifier. Existing records created with earlier hashing behavior may not pass the updated canonical-hash verifier and require an explicit migration/re-hash plan before rollout.

## Production blockers

Do not use this prototype as the sole control for real agent execution or submit sensitive customer data until the following are completed and tested:

- established identity, scoped credential lifecycle, rate limits and tenant provisioning;
- independently authenticated, scoped, expiring human approvals;
- a protected execution adapter that rechecks authority at execution time, binds approvals to exact action parameters, handles retries/timeouts and records actual outcomes;
- formal schema migrations, least-privilege database roles and database-level tenant isolation;
- evidence checkpoint/export verification and retention/deletion controls;
- contract analysis with human review, operational monitoring, backup/restore tests, threat modelling and cross-tenant security tests.
