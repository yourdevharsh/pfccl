import path from "node:path";

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export function assertSafeSegment(value, label = "path segment") {
  if (typeof value !== "string" || !SAFE_SEGMENT.test(value) || value === "." || value === "..") {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
  return value;
}

export function assertSafeDetailKey(value, allowed) {
  assertSafeSegment(value, "detail key");
  if (!allowed.includes(value)) {
    const error = new Error("Unsupported detail key.");
    error.status = 404;
    throw error;
  }
  return value;
}

export function safeJoin(root, ...segments) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...segments);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    const error = new Error("Unsafe storage path.");
    error.status = 400;
    throw error;
  }
  return resolved;
}

export function sanitizeFileName(name) {
  const base = path.basename(String(name || "file"));
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "");
  return sanitized.slice(0, 180) || "file";
}
