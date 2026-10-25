# Envarith Defensibility and Data Sovereignty Architecture

**Status:** Product architecture proposal. This document defines design requirements; it does not claim that every control is already implemented.

## Strategic principle

Envarith must earn durable customer value by becoming the trusted authority and evidence layer for consequential AI actions—not by trapping customer data, creating needless switching costs, or reselling one customer's operational intelligence to another.

**Customer data stays under customer control. Envarith's product IP stays under Envarith's control.** These are complementary commitments.

## The defensibility thesis

A competitor can copy a feature list. It is harder to reproduce a deployed, customer-specific operational system built from:
1. A versioned authority model for agents, actions, resources, monetary limits, conditions, and human escalation.
2. A policy-to-authority compiler that maps approved policies and contract obligations into enforceable, testable controls.
3. A continuously maintained Accountability Graph connecting agent and model versions, prompts/policies, tools, data sources, approvals, owners, actions, outcomes, and incidents.
4. A reproducible evidence pipeline that records what was requested, which policy version was evaluated, why the decision was made, what approval was given, and what happened after execution.
5. A change-impact and reauthorization engine that identifies when model, tool, policy, contract, owner, or risk changes should invalidate or narrow existing authority.
6. Deployment knowledge and integrations that let customers apply the same governance model across their actual systems.

This is a compounding product advantage, not a claim of being impossible to copy. Protect it through implementation quality, accumulated customer-specific configuration, integration depth, trusted evidence, and continuous improvement.

## Data sovereignty: non-negotiable rules

### 1. Tenant isolation
- Every customer-owned record must be scoped to a tenant and authorized server-side.
- The server derives tenant identity from authenticated identity and membership; it must not trust a client-supplied tenant ID as proof of access.
- Database queries, object storage, search, exports, jobs, logs, and caches must enforce the same tenant boundary.
- Add automated cross-tenant access tests before production release.

### 2. Customer data use
- Customer prompts, documents, contracts, policies, action records, identity data, evidence, and operational graphs are private to that tenant by default.
- Do not train shared models on customer content or use it to benefit another customer by default.
- Any optional cross-customer benchmarking or model improvement must be explicit opt-in, purpose-limited, documented, revocable where technically and legally feasible, and designed to minimize disclosure.
- Never expose one customer's contract terms, policies, incidents, graph structure, prompts, or action patterns to another customer.

### 3. Customer control and portability
- Provide export of customer-owned records in documented, machine-readable formats.
- Support deletion and retention rules with clear exceptions for legal holds, backups, and required audit retention.
- Document backup, restore, retention, and deletion behavior.
- Portability applies to customer data and records—not to Envarith's proprietary source code, compiler logic, generic policy libraries, product designs, or internal implementation.

### 4. Envarith intellectual property
- Keep source repositories private; apply least-privilege access, MFA, protected branches, dependency review, secret scanning, and auditable releases.
- Keep signing keys and production secrets out of source control and client-side bundles.
- Separate customer-specific configuration and data from Envarith's reusable engine and generic control libraries.
- Use explicit contracts and contributor agreements to clarify ownership of customer data, customer-specific deliverables, Envarith background IP, and any jointly developed work. Obtain legal review; do not rely on website wording alone.

## Proposed architecture: Sovereign Authority Fabric

```
Customer Systems / Agent Runtimes
          |
          v
Tenant Identity & Trust Boundary
          |
          v
Policy-to-Authority Compiler
          |
          v
Governed Action Envelope (GAE)
          |
          v
Server-side Decision Gateway
  PERMIT | CONDITIONAL | ESCALATE | DENY
          |
          +------> Human Authority / Approval
          |
          v
Action Connector / Execution Receipt
          |
          v
Tenant-scoped Evidence Ledger
          |
          v
Accountability Graph + Change Impact Engine
          |
          v
Revocation / Reauthorization / Incident Response
```

This is a target architecture. The current demo evaluator is not a production security boundary, and the complete runtime gateway, connectors, tenant isolation, evidence ledger, and change-impact engine must be implemented and independently tested before claims of production enforcement.

## Unique mechanism: Authority Continuity Record

For every consequential action, the system should be able to reconstruct a verifiable chain:
- who or what requested the action;
- which tenant and identity were involved;
- the applicable authority envelope and version;
- the policy and rule versions evaluated;
- the input facts and evidence references used for the decision;
- the decision, reason codes, conditions, and escalation path;
- the human approver and approval scope, if required;
- the connector/execution receipt and observed outcome;
- later revocations, corrections, incidents, and remediation.

The record should use canonical serialization, stable identifiers, versioned schemas, cryptographic hashes, and signed checkpoints where appropriate. Hashes and signatures can help detect alteration and establish provenance; they do not prove that an input was true, that a connector behaved correctly, or that a decision was lawful. Key management, trusted timestamps, retention, and independent verification require explicit design and testing.

## Revenue and pricing power

Charge for measurable operational value, not for holding data hostage. Potential value metrics:
- number of governed agents or protected action pathways;
- high-risk actions evaluated;
- evidence retention and verification requirements;
- integrations and environments;
- change-impact and reauthorization coverage;
- incident response and deployment support.

Offer a paid pilot around one real workflow: define authority, enforce or simulate decisions, route exceptions, and produce an evidence package. Measure reduction in unowned actions, time to investigate, review effort, policy drift, and time to revoke authority. Avoid claiming ROI until measured.

## Switching costs without a bad marriage

The desired customer reaction is: “We could leave, but we prefer Envarith because it works and preserves our governance history.” Build earned retention through:
- useful daily workflows and reliable integrations;
- high-quality authority and evidence data models;
- portable exports that make trust credible;
- reproducible decision history and tested controls;
- transparent pricing, clear service levels, and documented exit procedures.

Do not create lock-in through opaque formats, hidden dependencies, punitive export fees, or deliberate data fragmentation.

## Implementation gates

1. **Now:** keep customer data/IP commitments explicit in product docs and site copy; keep secrets out of Git; maintain the current demo label.
2. **Before real customer data:** authentication, server-derived tenant context, authorization on every route, rate limits, abuse controls, secure secret management, privacy/retention policy, backup plan, threat model, and cross-tenant tests.
3. **Before enforcement claims:** server-side decision gateway, connector boundary, replay/idempotency strategy, signed execution receipts, policy versioning, revocation propagation, failure-mode design, audit tests, and independent security review.
4. **Before enterprise sales:** data processing terms, subprocessor list, incident response commitments, deletion/export procedure, access logging, backup/restore evidence, and a clearly scoped security roadmap.

## Positioning language

**Envarith — Govern the Action. Prove the Authority.**

“Your operational data stays yours. Envarith provides the authority model, decision workflow, and evidence infrastructure to govern consequential AI actions—without using your private operating intelligence as another customer's product.”

Use this wording only with a clear explanation of the actual data handling, subprocessors, retention, and contractual terms. Do not publish an absolute sovereignty guarantee until the technical controls and legal terms support it.
