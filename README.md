# Envarith

**Govern the Action. Prove the Authority.**

Envarith is an AI Authority Infrastructure project focused on defining what AI agents are permitted to do, when a human must intervene, and how consequential actions connect to accountable owners and reviewable evidence.

> **Status: active prototype engineering.** The repository includes a React website, a PostgreSQL-backed authority API, a reference policy evaluator, revocation, evidence-chain recording/verification, and accountability graph endpoints. The deployment is not yet verified live, and the API is not yet a production enforcement boundary.

## Core architecture

1. **Governed Action Envelope (GAE)** — a scoped, expiring, revocable mandate linking an agent subject, allowed/prohibited actions, resource scope, amount limits, required evidence, approval conditions, policy version, and accountable owner.
2. **Authority decision service** — evaluates proposed actions against the persisted envelope and returns `PERMIT`, `PERMIT_WITH_CONDITIONS`, `ESCALATE`, or `DENY` with reason codes.
3. **Evidence chain** — records envelope creation, revocation, and authorization decisions with canonical payload digests and per-tenant hash chaining; includes an endpoint to verify stored chain continuity.
4. **Accountability graph** — persists typed relationships between agents, policies, tools, people, actions, and other governed objects.
5. **Human oversight** — the prototype fails closed to escalation when required approval cannot be independently authenticated.

## Current API capabilities

- Health and database checks: `GET /health`, `GET /api/health`
- Create/list/revoke authority envelopes
- Evaluate and persist authorization decisions with idempotency conflict detection
- Read evidence events and verify stored evidence-chain integrity
- Create/list accountability graph edges
- Persist contact requests

See [API.md](./API.md) for endpoint contracts, authentication setup, examples, and limitations.

## Engineering and release standard

Every feature must have four things before it can be called production-ready:

1. **A defined contract** — inputs, outputs, side effects, errors, permissions and limits.
2. **A real implementation** — server-side behaviour and appropriate access controls, not just a clickable UI.
3. **Repeatable tests** — positive, negative, security and persistence tests appropriate to the feature, with actual results recorded.
4. **An honest status** — proposed, implemented-unverified, tested, independently verified, production-ready, or blocked.

A successful deployment is not a successful product by itself. A database write is not a verified record, and an integrity check does not automatically prove the truth or legal effect of an event. See [FEATURE_VERIFICATION_STANDARD.md](./FEATURE_VERIFICATION_STANDARD.md) for the complete policy and release gates.

## Important security boundaries

- The UI simulation is not a security boundary.
- `PERMIT` is a recorded policy decision, not proof that an external tool is blocked or allowed. No external action is executed by the current API.
- API authentication currently uses server-configured tenant-bound static bearer keys as a bootstrap mechanism.
- A claimed approval is not a verified approval.
- Hash chaining helps detect certain changes; it does not prove event truth or prevent an administrator from rewriting the entire chain without an independent checkpoint.
- Do not submit real customer secrets, sensitive contracts, or production agent traffic.

## Local development

Requirements: Node.js 20 or newer and PostgreSQL for database-backed endpoints.

```bash
npm install
npm run dev
```

Run automated checks:

```bash
npm run check:server
npm run typecheck
npm test
npm run build
```

Configure `DATABASE_URL` and `ENVARITH_API_KEYS` in the local environment for API testing. Never commit real credentials. See `.env.example` and [DEPLOYMENT.md](./DEPLOYMENT.md).

## Production readiness gates

Before using Envarith to govern real agent execution, complete and test: established identity and credential lifecycle, database-level tenant isolation, formal migrations, independently authenticated approval objects, a protected execution adapter with exact-action rechecks and idempotency, external evidence checkpoints, retention/export/deletion controls, monitoring, backup/restore tests, threat modelling, and cross-tenant security testing.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [DATA_SOVEREIGNTY_AND_DEFENSIBILITY.md](./DATA_SOVEREIGNTY_AND_DEFENSIBILITY.md), [ROADMAP.md](./ROADMAP.md), and [SECURITY.md](./SECURITY.md).
