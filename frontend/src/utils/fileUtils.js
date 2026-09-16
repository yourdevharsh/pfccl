export function getFileName(file) {
  if (!file) return "";
  if (typeof file === "string") return file.split("/").pop() || "File";
  return file.name || file.originalName || "File";
}

export function getFileUrl(file) {
  if (!file) return "";

  const rawUrl = typeof file === "string"
    ? file
    : file.url || file.downloadUrl || file.path || "";

  if (!rawUrl) return "";

  // Stored file records from older backend versions use /files/... while
  // the Express API is mounted below /api. Keep those records working.
  if (rawUrl.startsWith("/files/")) {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
    return `${apiBase}${rawUrl}`;
  }

  return rawUrl;
}

export function isPdfFile(file) {
  if (!file) return false;
  if (typeof file === "string") return /\.pdf(?:$|[?#])/i.test(file);
  return file.mimeType === "application/pdf" || file.type === "application/pdf" || /\.pdf$/i.test(getFileName(file));
}

export function createFileDownload(file) {
  const url = getFileUrl(file);
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.download = getFileName(file);
  link.target = "_blank";
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function getFileKey(file) {
  if (!file) return "";
  if (typeof file === "string") return `url:${file}`;
  return file.id ? `id:${file.id}` : `${file.url || ""}:${file.name || ""}:${file.size || ""}`;
}
