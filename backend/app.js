import fs from "node:fs/promises";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import repositoryRoutes from "./routes/repositoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { sendError } from "./utils/http.js";
import { ensureStorage } from "./services/storage.js";
import { assertSafeSegment, safeJoin } from "./utils/pathSafety.js";

export async function createApp() {
  await ensureStorage();
  const app = express();

  const allowedOrigins = config.corsOrigin === "*"
    ? null
    : config.corsOrigin.split(",").map((item) => item.trim()).filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || !allowedOrigins || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "pfccL-subsidiaries-api" });
  });

  app.use("/api/ai", aiRoutes);
  app.use("/api", repositoryRoutes);

  // Backward-compatible alias for file URLs already stored as /files/...
  // New file metadata uses /api/files/... but existing records do not need migration.
  app.get(
    "/files/:division/:year/:companyId/:detailDirectory/:fileName",
    async (req, res, next) => {
      try {
        assertSafeSegment(req.params.division, "division");
        assertSafeSegment(req.params.year, "year");
        assertSafeSegment(req.params.companyId, "company id");
        assertSafeSegment(req.params.detailDirectory, "detail directory");
        assertSafeSegment(req.params.fileName, "file name");

        const filePath = safeJoin(
          config.storageRoot,
          req.params.division,
          req.params.year,
          req.params.companyId,
          req.params.detailDirectory,
          req.params.fileName,
        );

        await fs.access(filePath);
        res.sendFile(filePath);
      } catch (error) {
        if (error?.code === "ENOENT") {
          error.status = 404;
          error.message = "File not found.";
        }
        next(error);
      }
    },
  );

  app.use((req, res) => {
    sendError(res, 404, "Endpoint not found.");
  });

  app.use((error, _req, res, _next) => {
    const status = error?.status || (error?.code === "LIMIT_FILE_SIZE" ? 413 : 500);
    const message = error?.code === "LIMIT_FILE_SIZE"
      ? `File exceeds the ${config.maxFileSize / 1024 / 1024} MB limit.`
      : error?.message || "Internal server error.";
    if (status >= 500) console.error(error);
    sendError(res, status, message);
  });

  return app;
}
