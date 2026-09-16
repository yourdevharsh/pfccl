import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

function numberEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: numberEnv(process.env.PORT, 3000),
  host: process.env.HOST || "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  maxFileSize: numberEnv(process.env.MAX_FILE_SIZE_MB, 50) * 1024 * 1024,
  storageRoot: path.resolve(backendRoot, process.env.STORAGE_ROOT || "./storage"),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, ""),
};
