-- Version 001: initial Envarith persistence schema.
-- Applied by the server's versioned migration runner.
-- Envarith PostgreSQL schema reference.
-- Keep this schema aligned with initializeDatabase() in server.mjs.
-- For production, replace startup-time CREATE TABLE with versioned migrations,
-- least-privilege database roles, and tested tenant-level row security.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
CREATE INDEX IF NOT EXISTS contact_requests_created_at_idx ON contact_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','governance_lead','reviewer','auditor','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, subject_id)
);

CREATE TABLE IF NOT EXISTS authority_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  accountable_owner_id TEXT NOT NULL,
  allowed_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  prohibited_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_amount NUMERIC(18,2),
  required_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  require_human_approval_for JSONB NOT NULL DEFAULT '[]'::jsonb,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED','EXPIRED','SUSPENDED')),
  policy_version TEXT NOT NULL,
  created_by TEXT NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > issued_at),
  CHECK (max_amount IS NULL OR max_amount >= 0),
  UNIQUE (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS authority_tenant_status_idx ON authority_envelopes(tenant_id,status);

CREATE TABLE IF NOT EXISTS authorization_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  envelope_id UUID,
  subject_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_id TEXT,
  requested_amount NUMERIC(18,2),
  outcome TEXT NOT NULL CHECK (outcome IN ('PERMIT','PERMIT_WITH_CONDITIONS','ESCALATE','DENY')),
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT NOT NULL,
  policy_version TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_digest TEXT,
  UNIQUE (tenant_id, request_id),
  FOREIGN KEY (tenant_id, envelope_id) REFERENCES authority_envelopes(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS decisions_tenant_time_idx ON authorization_decisions(tenant_id,evaluated_at DESC);

CREATE TABLE IF NOT EXISTS evidence_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_digest TEXT NOT NULL,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  UNIQUE (tenant_id, event_id),
  UNIQUE (tenant_id, event_hash)
);
CREATE INDEX IF NOT EXISTS evidence_tenant_time_idx ON evidence_events(tenant_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS accountability_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_type TEXT NOT NULL,
  from_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_id TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  UNIQUE (tenant_id,from_type,from_id,edge_type,to_type,to_id)
);
