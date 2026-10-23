# Security Policy

## Current maturity

Envarith is an early-stage project. Do not submit real customer data, credentials, secrets, sensitive contracts, or production agent traffic to this scaffold. The public UI is not an enforcement boundary, and no production security certification is claimed.

## Reporting a vulnerability

Until a dedicated security contact is published, do not disclose sensitive details in public issues. Contact the repository owner privately through GitHub's security reporting features if enabled.

## Engineering requirements

- Never commit API keys, tokens, passwords, private keys, or customer documents.
- Validate all client and integration inputs on the server.
- Enforce tenant isolation and authorization server-side.
- Use least-privilege service credentials and rotate them when exposed.
- Require explicit, scoped, expiring approval for high-impact actions.
- Check revocation state immediately before execution.
- Record security-relevant decisions without unnecessarily storing sensitive payloads.
- Redact secrets and personal data from logs.
- Protect dependencies and review changes to authorization logic.
- Test denied, expired, revoked, malformed, cross-tenant, and approval-mismatch cases.
- Treat generated contract analysis as a candidate interpretation requiring authorized review.

## Security claims

Tamper-evident logs can help detect modification; they do not prove event truth. No feature should be described as guaranteeing safety, compliance, or prevention of all unauthorized actions without narrowly scoped evidence supporting that claim.
