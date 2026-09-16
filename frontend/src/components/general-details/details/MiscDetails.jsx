import "./miscDetails.css";
function MiscDetails({ company, updateCompanies }) {
  return <div className="detail-page misc-details"><div className="detail-header"><div className="detail-eyebrow">MISCELLANEOUS</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Additional notes and information</p></div><div className="detail-card"><h3 className="detail-card-title">General Notes</h3><div className="detail-field"><label htmlFor="misc-notes">Notes</label><textarea id="misc-notes" value={company.misc?.notes ?? ""} onChange={(event) => updateCompanies(company.id, (current) => ({ ...current, misc: { ...(current.misc ?? {}), notes: event.target.value } }))} /></div></div></div>;
}
export default MiscDetails;
