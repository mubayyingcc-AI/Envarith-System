# Envarith

**Govern the Action. Prove the Authority.**

Envarith is an AI Authority Infrastructure project focused on defining what AI agents are permitted to do, when a human must intervene, and how consequential actions connect to accountable owners and reviewable evidence.

> **Current status:** foundation scaffold. This repository is the beginning of the implementation, not a claim that runtime enforcement, legal compliance, or production security is already complete.

## Product thesis

AI systems need more than a policy document or an activity log. Organizations need an operational link between a reviewed mandate, a proposed action, the decision to permit or block it, the accountable owner, and evidence explaining what happened.

## Initial product scope

1. **Authority** — create scoped, time-limited, revocable mandates for an agent.
2. **Oversight Center** — review exceptions, approvals, revocations, and risk signals.
3. **Accountability Graph** — connect agents, model versions, policies, tools, people, actions, and outcomes.
4. **Evidence Vault** — preserve a reviewable record of decisions and changes.
5. **Contract Intelligence** — map vendor contract obligations to candidate controls for human review.
6. **Incident Command** — coordinate containment, investigation, remediation, and reauthorization.
7. **Academy and Talent** — learning simulations, assessed skill records, and practitioner discovery.

## Design principles

- Deny by default when a required policy or authority check cannot be completed.
- Make the authorization decision explicit: `PERMIT`, `PERMIT_WITH_CONDITIONS`, `ESCALATE`, or `DENY`.
- Keep authorization enforcement server-side; client-side UI is never a security boundary.
- Bind authority to a subject, action scope, resources, limits, expiry, policy version, and accountable owner.
- Record approvals, overrides, revocations, and policy changes.
- Use human review for legal interpretation and consequential contract findings.
- Treat cryptographic integrity as evidence of tampering detection, not proof that an event was true or that a system is legally compliant.
- Label simulations and planned capabilities honestly.

## Getting started

This repository uses React, TypeScript, and Vite for the web interface.

```bash
npm install
npm run dev
```

## Planned implementation sequence

1. Public site and design system.
2. Authority mandate builder and policy-decision simulator.
3. API contracts, validation, and automated tests.
4. Identity, tenancy, persistent storage, and server-side authorization.
5. Evidence records, approvals, revocation, and incident workflows.
6. Contract intake and human-reviewed obligation mapping.
7. Integrations, threat modelling, security testing, and deployment hardening.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [DATA_SOVEREIGNTY_AND_DEFENSIBILITY.md](./DATA_SOVEREIGNTY_AND_DEFENSIBILITY.md), [ROADMAP.md](./ROADMAP.md), and [SECURITY.md](./SECURITY.md).
