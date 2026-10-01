import { config } from "../../config.js";

function normalizeText(value, maxChars = 100000) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text || "").length / 4));
}

function normalizeAiAnswer(text) {
  return String(text ?? "")
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[^\n]*\n?/, "").replace(/```$/, ""),
    )
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-+*]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatAiDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toISOString().slice(0, 10);
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (message) =>
        message && (message.role === "user" || message.role === "assistant"),
    )
    .slice(-config.aiMaxMessages)
    .map((message) => ({
      role: message.role,
      content: normalizeText(message.content, config.aiMaxMessageChars),
    }))
    .filter((message) => message.content);
}

export {
  normalizeText,
  estimateTokens,
  normalizeAiAnswer,
  formatAiDate,
  normalizeMessages,
};
