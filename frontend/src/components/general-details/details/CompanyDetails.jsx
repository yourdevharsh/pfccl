import { COMPANY_SUB_DETAILS, getSubDetailId } from "../../../config/treeConfig";
import "./companyDetails.css";

function statusLabel(status) {
  return String(status || "ACTIVE").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function CompanyDetails({ company, updateCompanies, onSelect, onOpenCompanyMeeting }) {
  const divisionName = company.division === "umpp" ? "UMPP" : "ITP";
  const update = (patch) => updateCompanies(company.id, (current) => ({ ...current, ...patch }));
  const master = company.master ?? {};

  return (
    <div className="detail-page company-details-page">
      <div className="detail-header"><div className="detail-eyebrow">COMPANY</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">{divisionName} • {company.id}</p></div>

      <div className="detail-card company-quick-card">
        <div className="company-quick-status">
          <span className={`company-profile-status status-${String(company.status || "ACTIVE").toLowerCase()}`}>{statusLabel(company.status)}</span>
          <span className="company-profile-rule">Meeting profile: {String(company.meetingProfile || "STANDARD_120").replaceAll("_", " ")}</span>
        </div>
        <div className="company-quick-actions">
          <button type="button" className="detail-button primary" onClick={() => onOpenCompanyMeeting?.(company.id)}>Open Meetings</button>
        </div>
      </div>

      <div className="detail-card"><h3 className="detail-card-title">Company Overview</h3><div className="detail-form-grid">
        <div className="detail-field"><label htmlFor={`company-name-${company.id}`}>Company Name</label><input id={`company-name-${company.id}`} value={company.name ?? ""} onChange={(event) => update({ name: event.target.value })} /></div>
        <div className="detail-field"><label htmlFor={`company-status-${company.id}`}>Status</label><select id={`company-status-${company.id}`} value={company.status ?? "ACTIVE"} onChange={(event) => update({ status: event.target.value })}><option value="ACTIVE">Active</option><option value="TRANSFERRED">Transferred</option><option value="UNDER_INCORPORATION">Under incorporation</option><option value="DORMANT">Dormant</option><option value="CLOSED">Closed</option><option value="OTHER">Other</option></select></div>
        <div className="detail-field"><label htmlFor={`company-division-${company.id}`}>Division</label><input id={`company-division-${company.id}`} value={divisionName} disabled /></div>
        <div className="detail-field"><label htmlFor={`company-id-${company.id}`}>Company ID</label><input id={`company-id-${company.id}`} value={company.id} disabled /></div>
        <div className="detail-field"><label htmlFor={`company-incorporation-${company.id}`}>Incorporation Date</label><input id={`company-incorporation-${company.id}`} type="date" value={company.incorporationDate ?? ""} onChange={(event) => update({ incorporationDate: event.target.value })} /></div>
        <div className="detail-field"><label htmlFor={`company-meeting-profile-${company.id}`}>Board Meeting Rule</label><select id={`company-meeting-profile-${company.id}`} value={company.meetingProfile ?? "STANDARD_120"} onChange={(event) => update({ meetingProfile: event.target.value })}><option value="STANDARD_120">Standard · 120 days</option><option value="HALF_YEAR_90">Half-year pattern · 90 day gap</option></select></div>
      </div></div>

      <div className="detail-card"><h3 className="detail-card-title">Key Registered Details</h3><div className="detail-stat-grid company-summary-grid">
        <div className="detail-stat"><span className="detail-stat-label">CIN</span><span className="company-stat-text">{master.cin || "Not recorded"}</span></div>
        <div className="detail-stat"><span className="detail-stat-label">PAN</span><span className="company-stat-text">{master.pan || "Not recorded"}</span></div>
        <div className="detail-stat"><span className="detail-stat-label">TAN</span><span className="company-stat-text">{master.tan || "Not recorded"}</span></div>
      </div></div>

      <div className="detail-card"><h3 className="detail-card-title">Company Modules</h3><div className="company-module-grid">
        {COMPANY_SUB_DETAILS.map((module) => <button key={module.key} type="button" className="company-module-card" onClick={() => onSelect(getSubDetailId(company.id, module.key))}><span>{module.name}</span><span aria-hidden="true">→</span></button>)}
      </div></div>
    </div>
  );
}
export default CompanyDetails;
