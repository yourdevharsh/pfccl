function FileField({ label, field, company, updateField }) {
  const file = company[field];

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    updateField(field, selectedFile);
  }

  function handleDelete() {
    updateField(field, null);
  }

  function handleDownload() {
    if (!file) return;

    // If it's a File object selected from the browser
    if (file instanceof File) {
      const url = URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();

      URL.revokeObjectURL(url);
      return;
    }

    // If it's an existing file URL/string from your backend
    if (typeof file === "string") {
      const link = document.createElement("a");
      link.href = file;
      link.download = file.split("/").pop();
      link.target = "_blank";
      link.click();
    }
  }

  return (
    <div className="form-group">
      <label>{label}</label>

      {!file ? (
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      ) : (
        <div className="file-preview">
          <span className="file-name">
            {file instanceof File ? file.name : file.split("/").pop()}
          </span>

          <div className="file-actions">
            <button
              type="button"
              className="file-action download"
              onClick={handleDownload}
              title="Download"
            >
              ↓
            </button>

            <button
              type="button"
              className="file-action delete"
              onClick={handleDelete}
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CertificatesForm({ company, updateCompanies }) {
  function updateField(field, value) {
    updateCompanies((current) =>
      current.map((item) => {
        if (item.id !== company.id) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  }

  const certificateFields = [
    { key: "coi", label: "COI" },
    { key: "moa", label: "MOA" },
    { key: "aoa", label: "AOA" },
    { key: "gst", label: "GST" },
    { key: "espf", label: "ESPF" },
  ];

  return (
    <div className="company-form">
      <div className="form-grid">
        {/* Company Name */}
        <div className="form-group">
          <label>Company Name</label>

          <input
            type="text"
            value={company.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </div>

        {/* Division */}
        <div className="form-group">
          <label>Division</label>

          <input
            value={company.division === "umpp" ? "UMPP" : "ITP"}
            disabled
          />
        </div>

        {/* Certificate Files */}
        {certificateFields.map(({ key, label }) => (
          <FileField
            key={key}
            label={label}
            field={key}
            company={company}
            updateField={updateField}
          />
        ))}
      </div>
    </div>
  );
}

export default FileField;
