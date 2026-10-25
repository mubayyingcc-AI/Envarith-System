# Envarith deployment guide

## Current deployment status

The Railway project and PostgreSQL service exist, and a public domain has been assigned to the web service. The web service has previously shown no recorded deployment, and a repository source connection attempt was rejected because Railway did not have access to `mubayyingcc-AI/Envarith-System`. A domain is not proof that the application is deployed or healthy.

## Connect GitHub to Railway

1. Open https://github.com/settings/installations.
2. Find Railway and configure repository access to `mubayyingcc-AI/Envarith-System`.
3. Open https://railway.com/dashboard and select the Envarith project.
4. Open the `Envarith-System` web service and connect the repository's `main` branch.
5. Confirm the service uses the repository's `railway.toml` build and start commands.
6. Review build and runtime logs before treating the service as deployed.

If Railway still reports that the user does not have access to the repository, stop retrying the connection until GitHub App permissions have been corrected.

## Build and runtime

- Node.js: 20
- Build: `npm install && npm run build`
- Start: `npm start` (runs `node server.mjs`)
- Health check: `/health`
- Database health: `/api/health`
- Static assets: `dist/`

The server reads `DATABASE_URL`, `PORT`, `PGSSLMODE`, and `ENVARITH_API_KEYS`. Keep secrets in Railway variables, never in GitHub or client-side code. Use a private Railway database connection where possible; only disable TLS when the connection is explicitly trusted and private. Otherwise configure PostgreSQL TLS according to the provider's requirements.

## Database migrations

The server applies `database/migrations/001_initial.sql` through the migration runner and records a checksum in `envarith_schema_migrations`. Applied migration files are immutable: create a new numbered migration for future schema changes.

Before applying to an existing database:
1. Take a database backup or snapshot.
2. Confirm the current tables and columns match the initial migration.
3. Check the migration checksum and server logs.
4. Test the migration against a disposable copy of the existing database.
5. Verify `GET /api/health`, create/read/revoke/evaluate workflows, and evidence-chain verification after deployment.

The first migration uses `CREATE TABLE IF NOT EXISTS` so it can establish the migration record for a database previously initialized by the early prototype, but this is not a substitute for schema-drift checks. Existing rows written with older evidence-hashing behavior may need an explicit compatibility/re-hash plan.

## Required environment variables

- `DATABASE_URL`: PostgreSQL connection string.
- `NODE_ENV=production`.
- `ENVARITH_API_KEYS`: server-side JSON array of long random bearer keys bound to provisioned tenant UUIDs, subjects and roles. Generate unique credentials securely; never reuse examples from documentation.
- `PGSSLMODE`: configure consistently with the actual database connection path and TLS requirements.

Do not put `ENVARITH_API_KEYS` in a Vite `VITE_*` variable, browser bundle, repository, or public documentation.

## Verification checklist

- [ ] Railway shows a successful deployment for the latest intended commit.
- [ ] `/health` returns HTTP 200.
- [ ] `/api/health` returns HTTP 200 with a connected database.
- [ ] CI passes server syntax, TypeScript, unit tests and production build.
- [ ] API keys authenticate and roles reject unauthorized operations.
- [ ] Tenant A cannot read or mutate Tenant B data.
- [ ] Revocation changes subsequent decisions.
- [ ] Replaying identical requests is idempotent; changed inputs with the same request ID return 409.
- [ ] Evidence verification passes for newly generated events and detects controlled tampering.
- [ ] Database backup/restore has been tested.

## Important security boundary

The current API records authorization decisions but does not execute external agent actions. A `PERMIT` result must not be treated as runtime enforcement. Do not use this prototype as the sole control for production agents or submit sensitive customer data until identity, tenant isolation, verified approvals, protected execution adapters, external evidence checkpoints, and security testing are complete.
