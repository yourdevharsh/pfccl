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
  groqApiKey: process.env.GROQ_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  aiSystemPromptTokenLimit: numberEnv(process.env.AI_SYSTEM_PROMPT_TOKEN_LIMIT, 24000),
  aiMaxPdfCharsPerFile: numberEnv(process.env.AI_MAX_PDF_CHARS_PER_FILE, 80000),
  aiMaxElementChars: numberEnv(process.env.AI_MAX_ELEMENT_CHARS, 12000),
  aiMaxSelections: numberEnv(process.env.AI_MAX_SELECTIONS, 20),
  aiMaxMessages: numberEnv(process.env.AI_MAX_MESSAGES, 20),
  aiMaxMessageChars: numberEnv(process.env.AI_MAX_MESSAGE_CHARS, 12000),
};
