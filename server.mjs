import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
      // Railway's internal Postgres service uses a platform-managed private network.
      // The bundled Postgres template uses a self-signed TLS certificate.
      ssl: { rejectUnauthorized: false },
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
async function initializeDatabase() {
  if (!pool) {
    console.warn("DATABASE_URL is not configured; contact submissions are disabled.");
    return;
  }
  try {
    await pool.query(`
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
    `);
    databaseReady = true;
    console.log("PostgreSQL connected; contact_requests schema is ready.");
  } catch (error) {
    databaseReady = false;
    console.error("Database initialization failed:", error.message);
  }
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "envarith-web" });
});

app.get("/api/health", async (_req, res) => {
  if (!pool) return res.status(503).json({ status: "degraded", database: "not-configured" });
  try {
    await pool.query("SELECT 1");
    databaseReady = true;
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    databaseReady = false;
    return res.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

app.post("/api/contact", async (req, res) => {
  if (!pool || !databaseReady) {
    return res.status(503).json({ error: "Contact submissions are temporarily unavailable. Please try again later." });
  }
  const { name, email, organization = "", role = "", useCase = "", consent, website = "" } = req.body ?? {};
  // Honeypot: bots should fill this field; legitimate users should leave it empty.
  if (typeof website === "string" && website.trim()) return res.status(200).json({ ok: true });
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120) {
    return res.status(400).json({ error: "Please enter your name." });
  }
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (typeof useCase !== "string" || useCase.trim().length < 10 || useCase.trim().length > 5000) {
    return res.status(400).json({ error: "Please describe your use case in at least 10 characters." });
  }
  if (consent !== true) return res.status(400).json({ error: "Please confirm that Envarith may use these details to respond to your enquiry." });

  try {
    const result = await pool.query(
      `INSERT INTO contact_requests (name, email, organization, role, use_case, consent)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        typeof organization === "string" ? organization.trim().slice(0, 180) : "",
        typeof role === "string" ? role.trim().slice(0, 120) : "",
        useCase.trim(),
        true,
      ],
    );
    return res.status(201).json({ ok: true, reference: `ENQ-${result.rows[0].id}`, message: "Your enquiry has been received." });
  } catch (error) {
    console.error("Contact request could not be saved:", error.message);
    return res.status(500).json({ error: "We couldn't save your enquiry. Please try again later." });
  }
});

app.use(express.static(distPath, {
  index: false,
  maxAge: "1h",
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  },
}));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found." });
  }
  res.sendFile(path.join(distPath, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  console.error("Request failed:", error.message);
  if (!res.headersSent) res.status(500).send("An unexpected server error occurred.");
});

await initializeDatabase();
app.listen(port, host, () => {
  console.log(`Envarith web server listening on ${host}:${port}`);
});

process.on("SIGTERM", async () => {
  if (pool) await pool.end().catch(() => {});
  process.exit(0);
});
