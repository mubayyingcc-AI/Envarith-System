import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 4173);
const host = "0.0.0.0";
const root = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(root, "dist");

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "envarith-web" });
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
    return res.status(404).json({ error: "API route not implemented in this deployment." });
  }
  res.sendFile(path.join(distPath, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  console.error("Request failed:", error.message);
  if (!res.headersSent) res.status(500).send("An unexpected server error occurred.");
});

app.listen(port, host, () => {
  console.log(`Envarith web server listening on ${host}:${port}`);
});
