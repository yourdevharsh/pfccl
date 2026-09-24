function firstFileName(value) {
  if (!value || typeof value !== "object") return "";
  const candidates = [
    value.originalName,
    value.originalname,
    value.originalFilename,
    value.name,
    value.fileName,
    value.filename,
    value.metadata?.originalName,
    value.metadata?.name,
    value.file?.originalName,
    value.file?.name,
    value.file?.metadata?.originalName,
  ];
  return candidates.find((candidate) => {
    const text = String(candidate ?? "").trim();
    return text && text.toLowerCase() !== "file" && text.toLowerCase() !== "unnamed file";
  }) || "";
}

function fileNameFromUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl), window.location.href);
    const name = decodeURIComponent(parsed.pathname.split("/").pop() || "").trim();
    return name && !/^files?$/i.test(name) ? name : "";
  } catch {
    const name = decodeURIComponent(String(rawUrl).split(/[?#]/)[0].split("/").pop() || "").trim();
    return name && !/^files?$/i.test(name) ? name : "";
  }
}

export function getFileName(file) {
  if (!file) return "";
  if (typeof file === "string") return fileNameFromUrl(file) || "File";
  const direct = firstFileName(file);
  if (direct) return direct;
  const rawUrl = file.url || file.downloadUrl || file.path || file.href || "";
  return fileNameFromUrl(rawUrl) || "File";
}

export function getFileUrl(file) {
  if (!file) return "";
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

  // The file id is the canonical repository identity. Prefer it even when a
  // legacy absolute/path URL is still present in older database records.
  if (typeof file === "object" && file.id) {
    return `${apiBase}/files/${encodeURIComponent(file.id)}`;
  }

  const rawUrl = typeof file === "string" ? file : file.url || file.downloadUrl || file.path || "";
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl, window.location.href);
    if (parsed.pathname.startsWith("/api/files/")) return `${apiBase}${parsed.pathname.slice("/api".length)}${parsed.search}`;
    if (parsed.pathname.startsWith("/files/")) return `${apiBase}${parsed.pathname}${parsed.search}`;
    if (parsed.origin !== window.location.origin) return parsed.href;
  } catch {
    // Fall through to the path normalization below for malformed/relative URLs.
  }

  if (rawUrl.startsWith("/api/files/")) return `${apiBase}${rawUrl.slice("/api".length)}`;
  if (rawUrl.startsWith("/files/")) return `${apiBase}${rawUrl}`;
  if (rawUrl.startsWith("/")) return rawUrl;
  return `${apiBase}/${rawUrl.replace(/^\/+/, "")}`;
}


export function getFileCandidates(file) {
  if (!file) return [];
  const candidates = [];
  const canonical = getFileUrl(file);
  if (canonical) candidates.push(canonical);

  if (typeof file !== "string") {
    const rawUrl = file.url || file.downloadUrl || file.path || "";
    if (rawUrl) {
      const fallbackFile = { ...file, id: undefined };
      const fallback = getFileUrl(fallbackFile);
      if (fallback && !candidates.includes(fallback)) candidates.push(fallback);
    }
  }
  return candidates;
}

export function isPdfFile(file) {
  if (!file) return false;
  const name = getFileName(file);
  if (typeof file === "string") return /\.pdf(?:$|[?#])/i.test(file);
  return String(file.mimeType || file.type || file.metadata?.mimeType || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(name);
}

export function createFileDownload(file) {
  let url = getFileUrl(file);
  if (!url) return false;
  if (url.includes("/files/")) {
    url += url.includes("?") ? "&download=1" : "?download=1";
  }
  const link = document.createElement("a");
  link.href = url;
  link.download = getFileName(file) || "File";
  link.target = "_blank";
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

export function getFileKey(file) {
  if (!file) return "";
  if (typeof file === "string") return `url:${file}`;
  return file.id ? `id:${file.id}` : `${file.url || file.downloadUrl || ""}:${getFileName(file)}:${file.size || ""}`;
}
