export function getFileName(file) {
  if (!file) return "";
  if (typeof file === "string") return file.split("/").pop() || "File";
  return file.name || "File";
}

export function isPdfFile(file) {
  if (!file) return false;
  if (typeof file === "string") return /\.pdf(?:$|[?#])/i.test(file);
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
}

export function createFileDownload(file) {
  if (!file) return;

  const isBrowserFile =
    typeof File !== "undefined" && file instanceof File;

  if (isBrowserFile) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }

  if (typeof file === "string") {
    const link = document.createElement("a");
    link.href = file;
    link.download = getFileName(file);
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export function getFileKey(file) {
  if (!file) return "";
  if (typeof file === "string") return `url:${file}`;
  return [file.name, file.size, file.lastModified, file.type].join(":");
}
