import FileField from "../../utils/FileField";

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

export default CertificatesForm;
