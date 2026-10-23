# Railway Deployment Guide

This repository is prepared for a Railway web-service deployment. The actual Railway project must be created from an authenticated Railway account; this repository integration cannot create or configure resources inside that account.

## Deploy from GitHub

1. Sign in at https://railway.com/dashboard.
2. Choose **New Project** → **Deploy from GitHub repo**.
3. Connect GitHub if prompted. Ensure Railway's GitHub app has access to the private repository `mubayyingcc-AI/Envarith-System`.
4. Select **Envarith-System** and start the deployment.
5. Railway should read `railway.toml`, run the build command, then start the Express static server.
6. After the deployment is healthy, open the service **Settings → Networking** and choose **Generate Domain** to create a public Railway URL.
7. Visit the generated URL and confirm the home page loads. Also visit `/health`; it should return JSON with `"status":"ok"`.

Official guide: https://docs.railway.com/quick-start

## Repository deployment settings

- Build: `npm install && npm run build`
- Start: `npm start` (runs `node server.mjs`)
- Health check: `/health`
- Port: uses Railway's injected `PORT` environment variable
- Static output: `dist/`

No environment secrets are required for the current static website scaffold. Do not add credentials to GitHub or to `.env.example`.

## Automatic updates

When the Railway service is connected to the `main` branch, later commits can trigger automatic redeployments. Check the Railway deployment logs after each change.

## Current scope and limitations

This deployment serves the current React website and the client-side authority simulator. The simulator is not production authorization enforcement. The API routes, database, user authentication, persistent evidence storage, contract processing, incident workflows, Academy and Talent features still require implementation before the platform can be treated as a production control system.
