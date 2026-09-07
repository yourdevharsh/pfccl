import { createFileDownload, getFileName, isPdfFile } from "../../../utils/fileUtils";
import "./fileField.css";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 18v2h14v-2" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6m4-6v6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FileField({ label, value, onChange, onOpenFile, accept = ".pdf,application/pdf" }) {
  const files = Array.isArray(value) ? value : value ? [value] : [];
  const inputId = `file-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  function handleFileChange(event) {
    const newFiles = Array.from(event.target.files ?? []);
    if (!newFiles.length) return;

    onChange([...files, ...newFiles]);
    event.target.value = "";
  }

  function removeFile(index) {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className="file-field">
      <div className="file-field-label-row">
        <span className="file-field-label">{label}</span>
        <span className="file-field-count">
          {files.length} {files.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="file-field-list">
        {files.map((file, index) => (
          <div className="file-entry" key={`${getFileName(file)}-${index}`}>
            <button
              type="button"
              className="file-entry-name"
              onClick={() => isPdfFile(file) && onOpenFile?.(file, `${label} • ${getFileName(file)}`)}
              title={isPdfFile(file) ? "Open PDF" : getFileName(file)}
            >
              <span className="file-entry-dot" aria-hidden="true" />
              <span>{getFileName(file)}</span>
            </button>

            <div className="file-entry-actions">
              <button
                type="button"
                className="file-icon-button"
                onClick={() => createFileDownload(file)}
                title="Download file"
                aria-label={`Download ${getFileName(file)}`}
              >
                <DownloadIcon />
              </button>
              <button
                type="button"
                className="file-icon-button danger"
                onClick={() => removeFile(index)}
                title="Delete file"
                aria-label={`Delete ${getFileName(file)}`}
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
        ))}

        <label htmlFor={inputId} className="file-add-row">
          <span className="file-add-icon" aria-hidden="true">
            <PlusIcon />
          </span>
          <span>{files.length ? "Add more files" : "Choose files"}</span>
          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}

export default FileField;
