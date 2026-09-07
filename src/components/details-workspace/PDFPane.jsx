import { useEffect, useMemo } from "react";
import { getFileName } from "../../utils/fileUtils";
import "./pdfPane.css";

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5H5v3m0-3 6 6m5-6h3v3m0-3-6 6M8 19H5v-3m0 3 6-6m5 6h3v-3m0 3-6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7zM14 3v5h5" />
    </svg>
  );
}

function PDFPane({
  file,
  expanded,
  onExpand,
  onMinimize,
  onClose,
  paneNumber,
}) {
  const fileName = getFileName(file);
  const objectUrl = useMemo(() => {
    if (typeof File === "undefined" || !(file instanceof File)) return file;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (typeof File !== "undefined" && file instanceof File && objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file, objectUrl]);

  if (!expanded) {
    return (
      <aside className="pdf-pane pdf-pane-minimized" title={fileName}>
        <button
          type="button"
          className="pdf-rail-expand"
          onClick={onExpand}
          title={`Expand ${fileName}`}
          aria-label={`Expand ${fileName}`}
        >
          <ExpandIcon />
        </button>
        <button
          type="button"
          className="pdf-rail-close"
          onClick={onClose}
          title={`Close ${fileName}`}
          aria-label={`Close ${fileName}`}
        >
          <CloseIcon />
        </button>
        <div className="pdf-rail-label">
          <span>{fileName}</span>
        </div>
      </aside>
    );
  }

  return (
    <section className="pdf-pane pdf-pane-expanded">
      <div className="pdf-pane-header">
        <div className="pdf-pane-title" title={fileName}>
          <FileIcon />
          <span>{fileName}</span>
        </div>
        <div className="pdf-pane-actions">
          <button
            type="button"
            className="workspace-icon-button"
            onClick={onMinimize}
            title="Minimize PDF"
            aria-label={`Minimize ${fileName}`}
          >
            <MinimizeIcon />
          </button>
          <button
            type="button"
            className="workspace-icon-button danger"
            onClick={onClose}
            title="Close PDF"
            aria-label={`Close ${fileName}`}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="pdf-viewer-frame">
        {objectUrl ? (
          <iframe
            title={`${paneNumber}: ${fileName}`}
            src={objectUrl}
            className="pdf-viewer"
          />
        ) : (
          <div className="pdf-unavailable">
            This file cannot be previewed in the browser.
          </div>
        )}
      </div>
    </section>
  );
}

export default PDFPane;
