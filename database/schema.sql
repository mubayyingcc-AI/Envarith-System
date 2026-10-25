-- Envarith Sovereign Authority Fabric: initial PostgreSQL schema.
-- Tenant IDs are application-owned UUIDs. All tenant-scoped reads/writes must
-- be authorized server-side; database RLS is a later production hardening gate.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS authority_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  subject_id TEXT NOT NULL,
  accountable_owner_id TEXT NOT NULL,
  allowed_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  prohibited_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_resources JSONB,
  max_amount NUMERIC(18,2),
  required_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  require_human_approval_for JSONB NOT NULL DEFAULT '[]'::jsonb,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  policy_version TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason TEXT,
  CHECK (expires_at > issued_at)
);
CREATE INDEX IF NOT EXISTS authority_envelopes_tenant_subject_idx
  ON authority_envelopes (tenant_id, subject_id, status);

CREATE TABLE IF NOT EXISTS authority_decisions (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  envelope_id UUID NOT NULL REFERENCES authority_envelopes(id) ON DELETE RESTRICT,
  subject_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_id TEXT,
  amount NUMERIC(18,2),
  outcome TEXT NOT NULL CHECK (outcome IN ('PERMIT','PERMIT_WITH_CONDITIONS','ESCALATE','DENY')),
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  evidence_present JSONB NOT NULL DEFAULT '[]'::jsonb,
  human_approval_granted BOOLEAN NOT NULL DEFAULT FALSE,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, request_id)
);
CREATE INDEX IF NOT EXISTS authority_decisions_tenant_time_idx
  ON authority_decisions (tenant_id, decided_at DESC);

CREATE TABLE IF NOT EXISTS evidence_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evidence_events_tenant_time_idx
  ON evidence_events (tenant_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS contact_requests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  organization VARCHAR(180),
  role VARCHAR(120),
  use_case TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(24) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS contact_requests_created_at_idx
  ON contact_requests (created_at DESC);
