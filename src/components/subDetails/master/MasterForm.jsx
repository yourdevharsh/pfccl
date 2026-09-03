function MasterForm({ company, updateCompanies }) {
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

  return (
    <div className="company-form">
      <div className="form-grid">
        <div className="form-group">
          <label>Company Name</label>

          <input
            value={company.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Division</label>

          <input
            value={company.division === "umpp" ? "UMPP" : "ITP"}
            disabled
          />
        </div>

        <div className="form-group">
          <label>CIN</label>

          <input
            value={company.cin}
            onChange={(event) => updateField("cin", event.target.value)}
          />
        </div>

        <div className="form-group">
          <label>PAN</label>

          <input
            value={company.pan}
            onChange={(event) => updateField("pan", event.target.value)}
          />
        </div>

        <div className="form-group">
          <label>GSTIN</label>

          <input
            value={company.gstin}
            onChange={(event) => updateField("gstin", event.target.value)}
          />
        </div>

        <div className="form-group">
          <label>TAN</label>

          <input
            value={company.tan}
            onChange={(event) => updateField("tan", event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default MasterForm;
