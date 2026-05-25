import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import todosRouter from "./routes/todos.js";
import authRouter from "./routes/auth.js";
import { flushSave } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  app.use(cors());
}

app.use(express.json());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/todos", todosRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// In production, serve the built frontend
if (!isDev) {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (${isDev ? "dev" : "production"})`);
});

// Graceful shutdown ─ flush pending DB writes before exit
function shutdown() {
  console.log("\nShutting down gracefully...");
  flushSave();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
