import "./fileField.css";

function FileField({ label, value, onChange }) {
  const isBrowserFile =
    typeof File !== "undefined" && value instanceof File;

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) onChange(selectedFile);
  }

  function handleDownload() {
    if (!value) return;

    if (isBrowserFile) {
      const url = URL.createObjectURL(value);
      const link = document.createElement("a");
      link.href = url;
      link.download = value.name;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (typeof value === "string") {
      const link = document.createElement("a");
      link.href = value;
      link.download = value.split("/").pop() || "download";
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
    }
  }

  return (
    <div className="file-field">
      <span className="file-field-label">{label}</span>

      <div className="file-field-control">
        <label className="file-upload-button">
          Choose file
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
        </label>

        <span className={`file-field-name ${value ? "has-file" : ""}`}>
          {isBrowserFile
            ? value.name
            : typeof value === "string"
              ? value.split("/").pop()
              : "No file selected"}
        </span>

        {value && (
          <div className="file-field-actions">
            <button type="button" onClick={handleDownload} title="Download">
              ↓
            </button>
            <button type="button" onClick={() => onChange(null)} title="Delete">
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileField;
