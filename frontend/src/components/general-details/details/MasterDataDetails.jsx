import "./masterDataDetails.css";

function MasterDataDetails({ company, updateCompanies }) {
  function updateMasterField(field, value) {
    updateCompanies(company.id, (current) => ({ ...current, master: { ...(current.master ?? {}), [field]: value } }));
  }
  return (
    <div className="detail-page master-data-details">
      <div className="detail-header"><div className="detail-eyebrow">MASTER DATA</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">{company.id}-master-data</p></div>
      <div className="detail-card"><h3 className="detail-card-title">Registered Details</h3><div className="detail-form-grid">
        <div className="detail-field"><label htmlFor="master-company-name">Company Name</label><input id="master-company-name" value={company.name ?? ""} disabled /></div>
        <div className="detail-field"><label htmlFor="master-division">Division</label><input id="master-division" value={company.division === "umpp" ? "UMPP" : "ITP"} disabled /></div>
        {["cin", "pan", "gstin", "tan"].map((field) => <div className="detail-field" key={field}><label htmlFor={`master-${field}`}>{field.toUpperCase()}</label><input id={`master-${field}`} value={company.master?.[field] ?? ""} onChange={(event) => updateMasterField(field, event.target.value)} /></div>)}
      </div></div>
    </div>
  );
}
export default MasterDataDetails;
