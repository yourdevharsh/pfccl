import { useId, useState } from "react";
import { createFileDownload, getFileName, isPdfFile } from "../../utils/fileUtils";
import "./fileField.css";

function DownloadIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 18v2h14v-2" /></svg>; }
function DeleteIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6m4-6v6" /></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>; }

export default function FileField({ label, value, field, detailKey, companyId, onUpload, onDeleteFile, onOpenFile, accept = "*/*" }) {
  const rawFiles = Array.isArray(value)
    ? value
    : Array.isArray(value?.files)
      ? value.files
      : value
        ? [value]
        : [];
  const files = rawFiles.filter(Boolean);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = `file-${useId().replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  async function handleFileChange(event) {
    const newFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!newFiles.length || !onUpload) return;
    setBusy(true);
    setError("");
    try {
      await onUpload({ companyId, detailKey, field, files: newFiles });
    } catch (requestError) {
      setError(requestError?.message || "Unable to upload the selected files.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(file) {
    if (!onDeleteFile || !file?.id) return;
    setBusy(true);
    setError("");
    try {
      await onDeleteFile({ companyId, detailKey, field, fileId: file.id });
    } catch (requestError) {
      setError(requestError?.message || "Unable to delete this file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="document-field" data-ai-file-field="true" data-ai-field-name={label} data-ai-field-path={field} data-ai-company-id={companyId} data-ai-detail-key={detailKey}>
      <div className="document-field-label-row">
        <span className="document-field-label">{label}</span>
        <span className="document-field-count">{files.length} {files.length === 1 ? "file" : "files"}</span>
      </div>
      <div className="document-field-list">
        {files.map((file, index) => {
          const name = getFileName(file) || "File";
          const canOpen = Boolean(file?.id || file?.url || file?.downloadUrl) && isPdfFile(file);
          const canDownload = Boolean(file?.id || file?.url || file?.downloadUrl || typeof file === "string");
          return (
            <div
              className="document-entry file-entry"
              key={`${file?.id ?? name}-${index}`}
              data-ai-pdf-file={canOpen ? "true" : undefined}
              data-ai-file-id={file?.id || ""}
              data-ai-file-name={name}
              data-ai-mime-type={file?.mimeType || file?.type || "application/octet-stream"}
              data-ai-company-id={companyId}
              data-ai-detail-key={detailKey}
              data-ai-field={field}
            >
              <button
                type="button"
                className="document-entry-name file-entry-name"
                onClick={() => {
                  if (canOpen) {
                    onOpenFile?.({ ...file, __aiContext: { companyId, detailKey, field } }, `${label} • ${name}`);
                  } else if (canDownload) {
                    createFileDownload(file);
                  }
                }}
                disabled={!canOpen && !canDownload}
                title={canOpen ? "Open PDF" : canDownload ? "Download file" : "File unavailable"}
              >
                <span className={`document-file-dot ${canOpen ? "is-pdf" : ""}`} aria-hidden="true">{canOpen ? "PDF" : "FILE"}</span>
                <span className="document-entry-name-text">{name}</span>
              </button>
              <div className="document-entry-actions file-entry-actions">
                <button type="button" className="file-icon-button" onClick={() => createFileDownload(file)} title="Download file" aria-label={`Download ${name}`}><DownloadIcon /></button>
                <button type="button" className="file-icon-button danger" disabled={busy || !file?.id} onClick={() => handleDelete(file)} title={file?.id ? "Delete file" : "Delete unavailable for this legacy file"} aria-label={`Delete ${name}`}><DeleteIcon /></button>
              </div>
            </div>
          );
        })}
        <label htmlFor={inputId} className={`document-add-row file-add-row ${busy ? "disabled" : ""}`}>
          <span className="file-add-icon" aria-hidden="true"><PlusIcon /></span>
          <span>{busy ? "Saving files…" : files.length ? "Add more files" : "Choose files"}</span>
          <input id={inputId} type="file" accept={accept} multiple disabled={busy} onChange={handleFileChange} />
        </label>
      </div>
      {error && <div className="document-field-error" role="alert">{error}</div>}
    </div>
  );
}
