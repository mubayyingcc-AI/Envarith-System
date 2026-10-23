# Envarith Architecture

## 1. Core request path

A proposed agent action should pass through a server-side authorization service before a protected tool or business API executes.

```text
Agent / Integration
       |
       v
Action Request + Identity
       |
       v
Authority Gateway
       |
       +--> Mandate & Scope Validation
       +--> Policy Evaluation
       +--> Risk / Evidence Requirements
       +--> Human Approval Gate (when required)
       |
       v
Decision: PERMIT | PERMIT_WITH_CONDITIONS | ESCALATE | DENY
       |
       +--> Decision Evidence Record
       |
       v
Protected Tool Adapter (only after permit)
       |
       v
Outcome + Evidence + Accountability Links
```

The browser may demonstrate this flow, but it must not be trusted to enforce it.

## 2. Governed Action Envelope (GAE)

A GAE is the proposed machine-readable representation of an agent's authority. A production schema should include:

- unique envelope ID and schema version;
- tenant and subject/agent identity;
- allowed action types and resource scope;
- explicit prohibited actions;
- quantitative limits (for example, transaction value);
- required evidence and preconditions;
- approval and escalation requirements;
- accountable owner and authorized approver roles;
- issued-at, expiry, and revocation state;
- policy version and relevant integration/tool versions;
- integrity/signature metadata where implemented.

The GAE is a product design concept, not a claim of a standardized industry format.

## 3. Decision outcomes

- `PERMIT`: every mandatory authorization check passed.
- `PERMIT_WITH_CONDITIONS`: execution may proceed only if listed conditions are enforced by the server-side adapter.
- `ESCALATE`: a named authorized human must review the exact proposed action.
- `DENY`: action is not authorized; record the reason and relevant evidence.

A production evaluator must fail closed when required identity, policy, mandate, or revocation information is unavailable.

## 4. Accountability Graph

The graph is intended to connect:

`tenant → agent → model/version → prompt/configuration → policy → data reference → tool/API → authority envelope → human approval → accountable owner → action → outcome → incident/remediation`

Edges must carry provenance and timestamps. Graph links help investigations; they do not independently establish legal liability or factual truth.

## 5. Policy-to-authority workflow

1. Intake policy, contract, or operational requirement.
2. Extract candidate obligations with source references.
3. Have an authorized reviewer confirm interpretation.
4. Map approved requirements to structured controls and test cases.
5. Generate draft authority envelopes and evidence requirements.
6. Test in simulation or shadow mode.
7. Approve and activate through an authorized release workflow.
8. Re-evaluate or revoke authority after material changes or incidents.

Automated extraction must remain distinguishable from human-approved interpretation.

## 6. Evidence model

Evidence records should capture request ID, decision, reason codes, relevant policy/envelope versions, actor and owner references, timestamps, approval records, and outcome references. Later implementations may add append-only storage, hash chaining, signed checkpoints, or external verification.

A hash or signature can support integrity checks; it cannot prove the correctness of the underlying event.

## 7. Trust boundaries

- Browser and client state: untrusted.
- Agent-supplied action descriptions: untrusted until validated.
- Identity provider: trusted only within a documented configuration and threat model.
- Policy and authority store: security-critical.
- Tool adapters: must independently verify authorization before execution.
- Evidence store: access-controlled, retention-governed, and monitored.
- Human approval: bound to the exact action, limits, context, and expiry presented for review.

## 8. Initial technical shape

- Frontend: React + TypeScript + Vite.
- Validation: schema validation at all external boundaries.
- Backend: to be selected and implemented before production enforcement.
- Database: relational records for tenants, identities, envelopes, decisions, approvals, and evidence; graph projection may be added when justified.
- Authentication/authorization: enterprise identity integration and server-side tenant isolation are required before real customer data is used.
- Testing: unit, API contract, authorization-negative, tenant-isolation, revocation, and integration tests.

## 9. Non-goals and claims discipline

Envarith does not claim to guarantee safety, prevent every harmful action, determine legal liability, guarantee regulatory compliance, or replace legal counsel. Product capabilities must be marked as implemented, experimental, simulated, or planned.
