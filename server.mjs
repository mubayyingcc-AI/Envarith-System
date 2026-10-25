import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 4173);
const host = "0.0.0.0";
const root = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(root, "dist");
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  : null;

app.disable("x-powered-by");
app.use(express.json({ limit: "12kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
});

let databaseReady = false;
const allowedRoles = new Set(["owner", "admin", "governance_lead", "reviewer", "auditor", "viewer"]);
const writeRoles = new Set(["owner", "admin", "governance_lead"]);
const manageRoles = new Set(["owner", "admin"]);

// ENVARITH_API_KEYS is a JSON array of { key, tenantId, subjectId, role }.
// Tenant identity is derived from the matching server-side key, never from request body/header.
function loadApiKeys() {
  try {
    const parsed = JSON.parse(process.env.ENVARITH_API_KEYS || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) =>
      item && typeof item.key === "string" && item.key.length >= 32 &&
      typeof item.tenantId === "string" && typeof item.subjectId === "string" &&
      allowedRoles.has(item.role)
    ).map((item) => ({ ...item, digest: createHash("sha256").update(item.key).digest() }));
  } catch {
    console.error("ENVARITH_API_KEYS must be a valid JSON array.");
    return [];
  }
}
let apiKeys = loadApiKeys();
function refreshKeys(_req, _res, next) { apiKeys = loadApiKeys(); next(); }
function timingSafeDigest(token) { return createHash("sha256").update(token).digest(); }
function authenticate(req, res, next) {
  refreshKeys(req, res, () => {
    const header = req.get("authorization") || "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return res.status(401).json({ error: "A valid bearer API key is required." });
    const digest = timingSafeDigest(match[1]);
    const credential = apiKeys.find((item) => timingSafeEqual(item.digest, digest));
    if (!credential) return res.status(401).json({ error: "Invalid API credentials." });
    req.auth = { tenantId: credential.tenantId, subjectId: credential.subjectId, role: credential.role };
    return next();
  });
}
function requireRole(roles) {
  return (req, res, next) => roles.has(req.auth?.role)
    ? next()
    : res.status(403).json({ error: "Your role is not permitted to perform this operation." });
}
function requireDatabase(req, res, next) {
  if (!pool || !databaseReady) return res.status(503).json({ error: "Database is not ready." });
  next();
}
function asString(value, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function stringArray(value, maxItems = 100) {
  return Array.isArray(value) && value.length <= maxItems &&
    value.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 200)
    ? [...new Set(value.map((item) => item.trim()))] : null;
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
}

async function recordEvidence(client, { tenantId, subjectId, eventType, objectType, objectId, payload }) {
  // Serialize ledger-head updates per tenant inside the caller's transaction to avoid concurrent forks.
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [tenantId]);
  const canonicalPayload = canonicalJson(payload ?? {});
  const payloadDigest = sha256(canonicalPayload);
  const previous = await client.query(
    "SELECT event_hash FROM evidence_events WHERE tenant_id=$1 ORDER BY id DESC LIMIT 1 FOR UPDATE",
    [tenantId],
  );
  const previousHash = previous.rows[0]?.event_hash ?? null;
  const eventId = randomUUID();
  const occurredAt = new Date().toISOString();
  const eventHash = sha256([tenantId, eventId, eventType, subjectId, objectType, objectId, occurredAt, payloadDigest, previousHash || ""].join("|"));
  await client.query(
    `INSERT INTO evidence_events
      (tenant_id,event_id,event_type,subject_id,object_type,object_id,occurred_at,payload,payload_digest,previous_hash,event_hash,recorded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12)`,
    [tenantId,eventId,eventType,subjectId,objectType,objectId,occurredAt,canonicalPayload,payloadDigest,previousHash,eventHash,subjectId],
  );
  return { eventId, occurredAt, payloadDigest, previousHash, eventHash };
}

async function initializeDatabase() {
  if (!pool) {
    console.warn("DATABASE_URL is not configured; database-backed features are disabled.");
    return;
  }
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS contact_requests (
        id BIGSERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL,
        organization VARCHAR(180), role VARCHAR(120), use_case TEXT NOT NULL,
        consent BOOLEAN NOT NULL DEFAULT FALSE, status VARCHAR(24) NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS contact_requests_created_at_idx ON contact_requests(created_at DESC);
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tenant_memberships (
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        subject_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','admin','governance_lead','reviewer','auditor','viewer')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(tenant_id,subject_id)
      );
      CREATE TABLE IF NOT EXISTS authority_envelopes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        subject_id TEXT NOT NULL, accountable_owner_id TEXT NOT NULL,
        allowed_actions JSONB NOT NULL DEFAULT '[]'::jsonb, prohibited_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
        allowed_resources JSONB NOT NULL DEFAULT '[]'::jsonb, max_amount NUMERIC(18,2),
        required_evidence JSONB NOT NULL DEFAULT '[]'::jsonb, require_human_approval_for JSONB NOT NULL DEFAULT '[]'::jsonb,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','REVOKED','EXPIRED','SUSPENDED')),
        policy_version TEXT NOT NULL, created_by TEXT NOT NULL, revoked_at TIMESTAMPTZ, revoked_by TEXT, revocation_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK(expires_at > issued_at), CHECK(max_amount IS NULL OR max_amount >= 0), UNIQUE(tenant_id,id)
      );
      CREATE INDEX IF NOT EXISTS authority_tenant_status_idx ON authority_envelopes(tenant_id,status);
      CREATE TABLE IF NOT EXISTS authorization_decisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        request_id TEXT NOT NULL, envelope_id UUID, subject_id TEXT NOT NULL, action_type TEXT NOT NULL, resource_id TEXT,
        requested_amount NUMERIC(18,2), outcome TEXT NOT NULL CHECK(outcome IN ('PERMIT','PERMIT_WITH_CONDITIONS','ESCALATE','DENY')),
        reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb, explanation TEXT NOT NULL, policy_version TEXT,
        evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), input_digest TEXT, UNIQUE(tenant_id,request_id),
        FOREIGN KEY(tenant_id,envelope_id) REFERENCES authority_envelopes(tenant_id,id)
      );
      CREATE INDEX IF NOT EXISTS decisions_tenant_time_idx ON authorization_decisions(tenant_id,evaluated_at DESC);
      CREATE TABLE IF NOT EXISTS evidence_events (
        id BIGSERIAL PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        event_id UUID NOT NULL DEFAULT gen_random_uuid(), event_type TEXT NOT NULL, subject_id TEXT NOT NULL,
        object_type TEXT NOT NULL, object_id TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        payload JSONB NOT NULL DEFAULT '{}'::jsonb, payload_digest TEXT NOT NULL, previous_hash TEXT, event_hash TEXT NOT NULL,
        recorded_by TEXT NOT NULL, UNIQUE(tenant_id,event_id), UNIQUE(tenant_id,event_hash)
      );
      CREATE INDEX IF NOT EXISTS evidence_tenant_time_idx ON evidence_events(tenant_id,occurred_at DESC);
      CREATE TABLE IF NOT EXISTS accountability_edges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        from_type TEXT NOT NULL, from_id TEXT NOT NULL, edge_type TEXT NOT NULL, to_type TEXT NOT NULL, to_id TEXT NOT NULL,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by TEXT NOT NULL,
        UNIQUE(tenant_id,from_type,from_id,edge_type,to_type,to_id)
      );
    `);
    databaseReady = true;
    console.log("PostgreSQL connected; Envarith schemas are ready.");
  } catch (error) {
    databaseReady = false;
    console.error("Database initialization failed:", error.message);
  }
}

app.get("/health", (_req, res) => res.status(200).json({ status: "ok", service: "envarith-web" }));
app.get("/api/health", async (_req, res) => {
  if (!pool) return res.status(503).json({ status: "degraded", database: "not-configured" });
  try { await pool.query("SELECT 1"); databaseReady = true; return res.json({ status: "ok", database: "connected" }); }
  catch { databaseReady = false; return res.status(503).json({ status: "degraded", database: "unavailable" }); }
});

app.post("/api/contact", async (req, res) => {
  if (!pool || !databaseReady) return res.status(503).json({ error: "Contact submissions are temporarily unavailable. Please try again later." });
  const { name, email, organization = "", role = "", useCase = "", consent, website = "" } = req.body ?? {};
  if (typeof website === "string" && website.trim()) return res.status(200).json({ ok: true });
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120) return res.status(400).json({ error: "Please enter your name." });
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ error: "Please enter a valid email address." });
  if (typeof useCase !== "string" || useCase.trim().length < 10 || useCase.trim().length > 5000) return res.status(400).json({ error: "Please describe your use case in at least 10 characters." });
  if (consent !== true) return res.status(400).json({ error: "Please confirm that Envarith may use these details to respond to your enquiry." });
  try {
    const result = await pool.query(
      "INSERT INTO contact_requests (name,email,organization,role,use_case,consent) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,created_at",
      [name.trim(),email.trim().toLowerCase(),typeof organization==="string"?organization.trim().slice(0,180):"",typeof role==="string"?role.trim().slice(0,120):"",useCase.trim(),true],
    );
    return res.status(201).json({ ok: true, reference: `ENQ-${result.rows[0].id}`, message: "Your enquiry has been received." });
  } catch (error) { console.error("Contact request could not be saved:",error.message); return res.status(500).json({ error: "We couldn't save your enquiry. Please try again later." }); }
});

// All authority API routes authenticate with a server-configured, tenant-bound bearer key.
// No public endpoint accepts a tenant ID as proof of authorization.
const authorityRouter = express.Router();
authorityRouter.use(authenticate, requireDatabase);

authorityRouter.post("/envelopes", requireRole(writeRoles), async (req,res) => {
  const body=req.body ?? {};
  const subjectId=asString(body.subjectId,200);
  const ownerId=asString(body.accountableOwnerId,200);
  const allowed=stringArray(body.allowedActions);
  const prohibited=stringArray(body.prohibitedActions ?? []);
  const resources=stringArray(body.allowedResources ?? []);
  const evidence=stringArray(body.requiredEvidence ?? []);
  const human=stringArray(body.requireHumanApprovalFor ?? []);
  const expiresAt=Date.parse(body.expiresAt);
  const maxAmount=body.maxAmount === null || body.maxAmount === undefined || body.maxAmount === "" ? null : Number(body.maxAmount);
  const policyVersion=asString(body.policyVersion,100);
  if(!subjectId||!ownerId||!allowed||!prohibited||!resources||!evidence||!human||!policyVersion||!Number.isFinite(expiresAt)||expiresAt<=Date.now()||(maxAmount!==null&&(!Number.isFinite(maxAmount)||maxAmount<0)))
    return res.status(400).json({error:"Invalid envelope. Provide subjectId, accountableOwnerId, valid action/resource/evidence arrays, future expiresAt, policyVersion, and a non-negative maxAmount."});
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const tenant=await client.query("SELECT id FROM tenants WHERE id=$1 FOR UPDATE",[req.auth.tenantId]);
    if(!tenant.rowCount){await client.query("ROLLBACK");return res.status(403).json({error:"API key tenant is not provisioned in this database. Ask an Envarith administrator to provision it."});}
    const inserted=await client.query(
      `INSERT INTO authority_envelopes(tenant_id,subject_id,accountable_owner_id,allowed_actions,prohibited_actions,allowed_resources,max_amount,required_evidence,require_human_approval_for,expires_at,policy_version,created_by)
       VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10,$11,$12) RETURNING *`,
      [req.auth.tenantId,subjectId,ownerId,JSON.stringify(allowed),JSON.stringify(prohibited),JSON.stringify(resources),maxAmount,JSON.stringify(evidence),JSON.stringify(human),new Date(expiresAt).toISOString(),policyVersion,req.auth.subjectId]);
    const row=inserted.rows[0];
    await recordEvidence(client,{tenantId:req.auth.tenantId,subjectId:req.auth.subjectId,eventType:"AUTHORITY_ENVELOPE_CREATED",objectType:"authority_envelope",objectId:row.id,payload:{policyVersion,status:row.status,allowedActions:allowed,expiresAt:row.expires_at}});
    await client.query("COMMIT");
    return res.status(201).json({envelope:row});
  }catch(error){await client.query("ROLLBACK").catch(()=>{});console.error("Envelope create failed:",error.message);return res.status(500).json({error:"Could not create authority envelope."});}
  finally{client.release();}
});

authorityRouter.get("/envelopes", requireRole(new Set(["owner","admin","governance_lead","reviewer","auditor","viewer"])), async(req,res)=>{
  try{const result=await pool.query("SELECT * FROM authority_envelopes WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 200",[req.auth.tenantId]);return res.json({items:result.rows});}
  catch(error){console.error(error.message);return res.status(500).json({error:"Could not load authority envelopes."});}
});

authorityRouter.post("/envelopes/:id/revoke", requireRole(manageRoles), async(req,res)=>{
  const reason=asString(req.body?.reason,1000);
  if(reason.length<3)return res.status(400).json({error:"Provide a revocation reason of at least 3 characters."});
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const updated=await client.query(
      "UPDATE authority_envelopes SET status='REVOKED',revoked_at=NOW(),revoked_by=$3,revocation_reason=$4,updated_at=NOW() WHERE tenant_id=$1 AND id=$2 AND status='ACTIVE' RETURNING *",
      [req.auth.tenantId,req.params.id,req.auth.subjectId,reason]);
    if(!updated.rowCount){await client.query("ROLLBACK");return res.status(404).json({error:"Active authority envelope not found for this tenant."});}
    await recordEvidence(client,{tenantId:req.auth.tenantId,subjectId:req.auth.subjectId,eventType:"AUTHORITY_ENVELOPE_REVOKED",objectType:"authority_envelope",objectId:req.params.id,payload:{reason}});
    await client.query("COMMIT");return res.json({envelope:updated.rows[0]});
  }catch(error){await client.query("ROLLBACK").catch(()=>{});console.error(error.message);return res.status(500).json({error:"Could not revoke authority."});}
  finally{client.release();}
});

authorityRouter.post("/evaluate", requireRole(new Set(["owner","admin","governance_lead","reviewer"])), async(req,res)=>{
  const b=req.body??{};
  const requestId=asString(b.requestId,200), envelopeId=asString(b.envelopeId,100), subjectId=asString(b.subjectId,200), actionType=asString(b.actionType,200), resourceId=asString(b.resourceId,200);
  const evidence=stringArray(b.evidencePresent??[]);
  const amount=b.amount===undefined?null:Number(b.amount);
  if(!requestId||!envelopeId||!subjectId||!actionType||!evidence||(amount!==null&&(!Number.isFinite(amount)||amount<0)))return res.status(400).json({error:"Invalid evaluation request."});
  // Idempotency is bound to the complete request. Reusing a request ID with
  // different inputs must never silently return a stale decision.
  const digest=sha256(JSON.stringify({requestId,envelopeId,subjectId,actionType,resourceId,amount,evidence,humanApprovalGranted:b.humanApprovalGranted===true}));
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const existing=await client.query("SELECT * FROM authorization_decisions WHERE tenant_id=$1 AND request_id=$2",[req.auth.tenantId,requestId]);
    if(existing.rowCount){
      if(existing.rows[0].input_digest!==digest){
        await client.query("ROLLBACK");
        return res.status(409).json({error:"This requestId was already used with different inputs. Use a new requestId for a new evaluation."});
      }
      await client.query("COMMIT");
      return res.json({decision:existing.rows[0],idempotentReplay:true,executionPerformed:false});
    }
    const found=await client.query("SELECT * FROM authority_envelopes WHERE tenant_id=$1 AND id=$2 FOR SHARE",[req.auth.tenantId,envelopeId]);
    if(!found.rowCount){await client.query("ROLLBACK");return res.status(404).json({error:"Authority envelope not found for this tenant."});}
    const e=found.rows[0]; let outcome="DENY", reasons=[], explanation="Request denied by default.";
    const expires=new Date(e.expires_at).getTime(), issued=new Date(e.issued_at).getTime();
    if(e.status!=="ACTIVE"||issued>Date.now()||expires<=Date.now()){reasons=["AUTHORITY_NOT_ACTIVE_OR_EXPIRED"];explanation="Authority is inactive or outside its validity window.";}
    else if(subjectId!==e.subject_id){reasons=["SUBJECT_MISMATCH"];explanation="Request subject does not match the envelope.";}
    else if(e.prohibited_actions.includes(actionType)){reasons=["ACTION_EXPLICITLY_PROHIBITED"];explanation="Action is explicitly prohibited.";}
    else if(!e.allowed_actions.includes(actionType)){reasons=["ACTION_OUTSIDE_SCOPE"];explanation="Action is not in the authorized scope.";}
    else if(e.allowed_resources.length && (!resourceId||!e.allowed_resources.includes(resourceId))){reasons=["RESOURCE_OUTSIDE_SCOPE"];explanation="Resource is missing or outside the authorized scope.";}
    else if(e.max_amount!==null&&amount!==null&&amount>Number(e.max_amount)){outcome="ESCALATE";reasons=["AMOUNT_LIMIT_EXCEEDED"];explanation="Amount exceeds the envelope limit; human review is required.";}
    else if(e.max_amount!==null&&amount===null&&/(refund|payment|transfer|purchase|payout|charge|withdraw|credit)/i.test(actionType)){outcome="ESCALATE";reasons=["AMOUNT_REQUIRED_FOR_FINANCIAL_ACTION"];explanation="A financial action with an amount limit must include the requested amount; human review is required.";}
    else {const missing=e.required_evidence.filter(x=>!evidence.includes(x));if(missing.length){outcome="ESCALATE";reasons=["REQUIRED_EVIDENCE_MISSING"];explanation="Required evidence is missing: "+missing.join(", ")+ ".";}
      else if(e.require_human_approval_for.includes(actionType)&&b.humanApprovalGranted!==true){outcome="ESCALATE";reasons=["HUMAN_APPROVAL_REQUIRED"];explanation="This action requires human approval; no verified approval token was supplied.";}
      else if(e.require_human_approval_for.includes(actionType)){outcome="PERMIT_WITH_CONDITIONS";reasons=["HUMAN_APPROVAL_CLAIM_REQUIRES_VERIFICATION"];explanation="Approval was claimed but is not independently authenticated by this API; do not execute until verified.";}
      else {outcome="PERMIT";reasons=["AUTHORITY_CHECKS_PASSED"];explanation="Persisted envelope checks passed. A protected execution adapter must still enforce the result.";}
    }
    // Approval claims never independently authorize external execution. The API records a decision only.
    const inserted=await client.query(
      `INSERT INTO authorization_decisions(tenant_id,request_id,envelope_id,subject_id,action_type,resource_id,requested_amount,outcome,reason_codes,explanation,policy_version,input_digest)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12) RETURNING *`,
      [req.auth.tenantId,requestId,envelopeId,subjectId,actionType,resourceId||null,amount,outcome,JSON.stringify(reasons),explanation,e.policy_version,digest]);
    await recordEvidence(client,{tenantId:req.auth.tenantId,subjectId:req.auth.subjectId,eventType:"AUTHORIZATION_DECISION_RECORDED",objectType:"authorization_decision",objectId:inserted.rows[0].id,payload:{requestId,envelopeId,outcome,reasons,policyVersion:e.policy_version,inputDigest:digest}});
    await client.query("COMMIT");return res.status(201).json({decision:inserted.rows[0],executionPerformed:false});
  }catch(error){await client.query("ROLLBACK").catch(()=>{});if(error.code==="23505")return res.status(409).json({error:"Request ID already exists; use a unique requestId per decision."});console.error("Evaluation failed:",error.message);return res.status(500).json({error:"Could not evaluate and persist this request."});}
  finally{client.release();}
});

authorityRouter.get("/evidence/verify", requireRole(new Set(["owner","admin","governance_lead","auditor"])), async(req,res)=>{
  try {
    const result = await pool.query(
      "SELECT id,event_id,event_type,subject_id,object_type,object_id,occurred_at,payload,payload_digest,previous_hash,event_hash FROM evidence_events WHERE tenant_id=$1 ORDER BY id ASC",
      [req.auth.tenantId],
    );
    let previousHash = null;
    const failures = [];
    for (const row of result.rows) {
      const occurredAt = new Date(row.occurred_at).toISOString();
      const payloadDigest = sha256(canonicalJson(row.payload ?? {}));
      const expectedHash = sha256([
        req.auth.tenantId, row.event_id, row.event_type, row.subject_id,
        row.object_type, row.object_id, occurredAt, row.payload_digest,
        row.previous_hash || "",
      ].join("|"));
      if (row.previous_hash !== previousHash) failures.push({ eventId: row.event_id, reason: "PREVIOUS_HASH_MISMATCH" });
      if (row.payload_digest !== payloadDigest) failures.push({ eventId: row.event_id, reason: "PAYLOAD_DIGEST_MISMATCH" });
      if (row.event_hash !== expectedHash) failures.push({ eventId: row.event_id, reason: "EVENT_HASH_MISMATCH" });
      previousHash = row.event_hash;
    }
    return res.json({
      verified: failures.length === 0,
      checkedEvents: result.rows.length,
      headHash: previousHash,
      failures: failures.slice(0, 100),
      note: "This verifies the stored tenant chain and payload digests. It does not prove the database operator could not rewrite the entire chain; export or externally anchor checkpoints for stronger independent assurance.",
    });
  } catch (error) {
    console.error("Evidence verification failed:", error.message);
    return res.status(500).json({ error: "Could not verify the evidence chain." });
  }
});

authorityRouter.get("/evidence", requireRole(new Set(["owner","admin","governance_lead","reviewer","auditor"])), async(req,res)=>{
  const limit=Math.min(200,Math.max(1,Number(req.query.limit)||50));
  try{const result=await pool.query("SELECT event_id,event_type,subject_id,object_type,object_id,occurred_at,payload,payload_digest,previous_hash,event_hash,recorded_by FROM evidence_events WHERE tenant_id=$1 ORDER BY id DESC LIMIT $2",[req.auth.tenantId,limit]);return res.json({items:result.rows});}
  catch(error){console.error(error.message);return res.status(500).json({error:"Could not load evidence events."});}
});

authorityRouter.post("/accountability/edges", requireRole(writeRoles), async(req,res)=>{
  const b=req.body??{}, fromType=asString(b.fromType,100),fromId=asString(b.fromId,200),edgeType=asString(b.edgeType,100),toType=asString(b.toType,100),toId=asString(b.toId,200),attributes=b.attributes??{};
  if(!fromType||!fromId||!edgeType||!toType||!toId||!attributes||typeof attributes!=="object"||Array.isArray(attributes)||JSON.stringify(attributes).length>5000)return res.status(400).json({error:"Provide valid edge endpoints and attributes (maximum 5 KB)."});
  try{const result=await pool.query(
    `INSERT INTO accountability_edges(tenant_id,from_type,from_id,edge_type,to_type,to_id,attributes,created_by)
     VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8) ON CONFLICT(tenant_id,from_type,from_id,edge_type,to_type,to_id)
     DO UPDATE SET attributes=EXCLUDED.attributes RETURNING *`,
    [req.auth.tenantId,fromType,fromId,edgeType,toType,toId,JSON.stringify(attributes),req.auth.subjectId]);
    return res.status(201).json({edge:result.rows[0]});
  }catch(error){console.error(error.message);return res.status(500).json({error:"Could not save accountability edge."});}
});
authorityRouter.get("/accountability/edges", requireRole(new Set(["owner","admin","governance_lead","reviewer","auditor","viewer"])), async(req,res)=>{
  try{const result=await pool.query("SELECT * FROM accountability_edges WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 500",[req.auth.tenantId]);return res.json({items:result.rows});}
  catch(error){console.error(error.message);return res.status(500).json({error:"Could not load accountability edges."});}
});
app.use("/api/authority",authorityRouter);

app.use(express.static(distPath,{index:false,maxAge:"1h",setHeaders(res,filePath){if(filePath.endsWith(".html"))res.setHeader("Cache-Control","no-cache");}}));
app.get("*",(req,res,next)=>{if(req.path.startsWith("/api/"))return res.status(404).json({error:"API route not found."});res.sendFile(path.join(distPath,"index.html"),(error)=>{if(error)next(error);});});
app.use((error,_req,res,_next)=>{console.error("Request failed:",error.message);if(!res.headersSent)res.status(500).send("An unexpected server error occurred.");});

await initializeDatabase();
app.listen(port,host,()=>console.log(`Envarith web server listening on ${host}:${port}`));
process.on("SIGTERM",async()=>{if(pool)await pool.end().catch(()=>{});process.exit(0);});
