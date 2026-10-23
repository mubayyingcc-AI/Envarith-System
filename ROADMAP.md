# Envarith Roadmap

Roadmap items are plans until implementation and verification are complete.

## Stage 0 — Repository foundation
- [x] Establish repository and initial documentation.
- [x] Add React, TypeScript, and Vite application scaffold.
- [ ] Add linting, formatting, and automated checks.
- [ ] Add architecture decision records.

## Stage 1 — Public product experience
- [ ] Responsive landing page and shared navigation.
- [ ] Platform pages for Authority, Oversight, Accountability, Evidence, Contracts, and Incidents.
- [ ] Clear separation between product capabilities, simulations, and roadmap.
- [ ] Contact/demo and assessment entry points.

## Stage 2 — Authority prototype
- [ ] Typed authority-envelope model and validation.
- [ ] Mandate builder for actions, resources, limits, expiry, owner, and escalation.
- [ ] Deterministic simulator with Permit, Permit with Conditions, Escalate, and Deny.
- [ ] Unit tests for boundary cases and fail-closed behavior.
- [ ] No real external action from the simulator.

## Stage 3 — Backend control plane
- [ ] Authentication and tenant isolation.
- [ ] Server-side authorization endpoint.
- [ ] Persistent authority, policy, approval, and decision records.
- [ ] Revocation checks and exact-action approvals.
- [ ] Audit events and access controls.

## Stage 4 — Evidence and incident workflows
- [ ] Evidence schema and export.
- [ ] Accountability graph data model.
- [ ] Incident intake, containment checklist, owner assignment, and remediation tracking.
- [ ] Retention and deletion policy.
- [ ] Integrity verification and negative tests.

## Stage 5 — Contract intelligence
- [ ] Secure document intake.
- [ ] Candidate obligation extraction with source spans.
- [ ] Reviewer confirmation and correction workflow.
- [ ] Obligation-to-control mapping.
- [ ] Findings export with clear limitations.

## Stage 6 — Academy and Talent
- [ ] Learning paths and practical simulations.
- [ ] Assessment criteria and skill passport.
- [ ] Consent-based practitioner profiles and employer discovery.
- [ ] No guarantee of employment or competence based solely on a badge.

## Stage 7 — Production readiness
- [ ] Threat model and security review.
- [ ] Dependency scanning and secret scanning.
- [ ] Tenant-isolation, authorization, revocation, and abuse tests.
- [ ] Monitoring, backup/restore, incident response, and retention controls.
- [ ] Deployment documentation and release checklist.
