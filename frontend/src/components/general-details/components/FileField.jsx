import { useState } from "react";
import { createFileDownload, getFileName, isPdfFile } from "../../../utils/fileUtils";
import "./fileField.css";

function DownloadIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 18v2h14v-2" /></svg>; }
function DeleteIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6m4-6v6" /></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>; }

function FileField({
  label,
  value,
  field,
  detailKey,
  companyId,
  onUpload,
  onDeleteFile,
  onOpenFile,
  accept = ".pdf,application/pdf",
}) {
  const files = Array.isArray(value) ? value : value ? [value] : [];
  const [busy, setBusy] = useState(false);
  const inputId = `file-${companyId}-${detailKey}-${field}`.replace(/[^a-zA-Z0-9_-]/g, "-");

  async function handleFileChange(event) {
    const newFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!newFiles.length || !onUpload) return;
    setBusy(true);
    try {
      await onUpload({ companyId, detailKey, field, files: newFiles });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(file) {
    if (!onDeleteFile || !file?.id) return;
    setBusy(true);
    try {
      await onDeleteFile({ companyId, detailKey, field, fileId: file.id });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="file-field">
      <div className="file-field-label-row">
        <span className="file-field-label">{label}</span>
        <span className="file-field-count">{files.length} {files.length === 1 ? "file" : "files"}</span>
      </div>

      <div className="file-field-list">
        {files.map((file, index) => {
          const name = getFileName(file);
          return (
            <div
              className="file-entry"
              key={`${file?.id ?? name}-${index}`}
              data-ai-file-id={file?.id || ""}
              data-ai-file-name={name}
              data-ai-mime-type={file?.mimeType || file?.type || "application/pdf"}
              data-ai-company-id={companyId}
              data-ai-detail-key={detailKey}
              data-ai-field={field}
            >
              <button
                type="button"
                className="file-entry-name"
                onClick={() => isPdfFile(file) && onOpenFile?.({ ...file, __aiContext: { companyId, detailKey, field } }, `${label} • ${name}`)}
                title={isPdfFile(file) ? "Open PDF" : name}
              >
                <span className="file-entry-dot" aria-hidden="true" />
                <span>{name}</span>
              </button>
              <div className="file-entry-actions">
                <button type="button" className="file-icon-button" onClick={() => createFileDownload(file)} title="Download file" aria-label={`Download ${name}`}>
                  <DownloadIcon />
                </button>
                <button type="button" className="file-icon-button danger" disabled={busy} onClick={() => handleDelete(file)} title="Delete file" aria-label={`Delete ${name}`}>
                  <DeleteIcon />
                </button>
              </div>
            </div>
          );
        })}

        <label htmlFor={inputId} className={`file-add-row ${busy ? "disabled" : ""}`}>
          <span className="file-add-icon" aria-hidden="true"><PlusIcon /></span>
          <span>{busy ? "Saving files…" : files.length ? "Add more files" : "Choose files"}</span>
          <input id={inputId} type="file" accept={accept} multiple disabled={busy} onChange={handleFileChange} />
        </label>
      </div>
    </div>
  );
}

export default FileField;
