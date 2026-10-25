# Envarith Feature Verification and Release Standard

**Status:** Adopted engineering policy  
**Applies to:** Every API endpoint, UI workflow, authorization rule, integration, data pipeline, evidence function, and operational capability.

**Principle:** A successful deployment is not proof of a successful product. A clickable section is not a functioning backend. A database write is not a verified record. A verified record is not automatically a legally valid commitment.

## The four mandatory requirements

Every feature must satisfy all four before it can be labelled **production-ready**.

### 1. Defined contract
Document the feature's purpose, inputs and schemas, validation, outputs and error codes, side effects, permissions, tenant scope, state transitions, idempotency and concurrency expectations where relevant, data lifecycle, failure behaviour, assumptions, and exclusions. Keep the contract versioned and close to the implementation.

### 2. Real implementation
Implement behaviour at the correct trust boundary. UI-only state, hard-coded demo data, client-supplied claims, placeholder handlers, and mocked responses do not count as backend implementation. Verify server-side validation, authorization, tenant isolation, least privilege, secure secrets, persistence/transactions, safe failures, replay handling, and logging that avoids exposing secrets. Clearly distinguish recording an authorization decision from enforcing or executing an external action.

### 3. Repeatable tests and persistence proof
Tests must cover expected behaviour, invalid inputs and boundaries, authentication/authorization failures, cross-tenant access attempts where applicable, dependency and partial failures, duplicate/replayed and concurrent requests where relevant, and regression cases. Prove persistence by writing, reading back from the authoritative store, and checking the stored result. Test migrations and recovery where relevant. For evidence, test content and integrity verification, while stating what verification does and does not prove. A test is not passed merely because it was written; record actual execution and result. Run tests reproducibly in CI where feasible.

### 4. Honest status
Use these statuses and support them with evidence:
- **Proposed** — design only.
- **Implemented — unverified** — code exists; required tests/checks have not all been demonstrated.
- **Tested** — specified tests passed in a named environment; this does not imply independent verification or production suitability.
- **Independently verified** — a defined verification was performed independently of the implementation, with scope and evidence recorded.
- **Production-ready** — applicable release gates passed, operational controls and residual risks documented, and an authorized release decision recorded.
- **Blocked** — a named dependency or unresolved defect prevents the next gate.

Scope status to the relevant commit/build, environment, test suite and date. Never infer status from UI appearance, a health endpoint, or a deployment indicator alone.

## Feature verification record
For each material feature, record: feature ID and owner; contract and version; implementation/code paths and security boundary; data classification, permissions, tenant scope and retention; positive, negative, security, persistence and failure tests; test command/CI run, commit SHA and actual result; independent verification scope; known limitations and residual risks; status, date and evidence references.

## Release gates
Before production-ready status, pass the applicable gates:
1. Contract is specified.
2. Real implementation and access controls exist.
3. Repeatable positive, negative, security and persistence tests pass.
4. Migration, backup/restore, retention, export and deletion behaviour is understood and tested where relevant.
5. Security review covers threat model, secrets, tenant isolation, identity, approval authenticity and failure modes.
6. Monitoring, alerting, recovery, ownership and incident response are documented.
7. Integrity and verification claims are narrowly stated and tested.
8. An accountable release owner approves the status and records remaining risks.

Prototype features may be useful before all production gates pass, but must be labelled accurately and not used beyond their verified boundary.

## Do not conflate these claims
- **Policy decision recorded:** an authorization outcome was stored.
- **Policy decision verified:** a defined check or reproduction against policy inputs passed.
- **Evidence integrity checked:** a specified integrity mechanism passed.
- **External action enforced:** a protected execution path controlled the real action as designed.
- **Human approval authenticated:** identity, intent, scope and approval event were verified appropriately.
- **Legal commitment valid:** legal effect depends on applicable law, authority, intent, contract terms and facts; software status alone does not establish it.

A stored event or hash does not by itself prove event truth, an approver's legal authority, contract enforceability, or legal/regulatory compliance.

## Application to Envarith
Apply this standard retrospectively. The current prototype's documented limitations remain: the UI is not a security boundary; an authorization response is not external-action enforcement; static bearer keys are bootstrap authentication, not a complete identity lifecycle; and a hash chain is not an independent trust anchor.

Report a deployment as deployed only when deployment evidence supports the claim. Report production-ready status only after applicable release gates pass.
