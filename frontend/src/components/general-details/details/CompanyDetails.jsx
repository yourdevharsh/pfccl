import { DateField, SelectField, TextField } from "../../ui/FormField";
import { COMPANY_SUB_DETAILS, getSubDetailId } from "../../../config/treeConfig";
import StatusPill from "../../ui/StatusPill";
import MeetingComplianceSummary from "../../meetings/MeetingComplianceSummary";
import "./companyDetails.css";

function statusLabel(status) { return String(status || "ACTIVE").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }

export default function CompanyDetails({ company, updateCompanies, onSelect, onOpenCompanyMeeting, meetingRow, onRecordEarlyBoardMeeting }) {
  const divisionName = company.division === "umpp" ? "UMPP" : "ITP";
  const update = (patch) => updateCompanies(company.id, (current) => ({ ...current, ...patch }));
  const master = company.master ?? {};

  return (
    <div className="detail-page company-details-page" data-ai-company-id={company.id} data-ai-detail-key="company" data-ai-section="false">
      <div className="detail-header"><div className="detail-eyebrow">COMPANY</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">{divisionName} • {company.id}</p></div>

      <div className="detail-card company-quick-card">
        <div className="company-quick-status"><StatusPill value={company.status} /><span className="company-profile-rule">Meeting profile: {String(company.meetingProfile || "STANDARD_120").replaceAll("_", " ")}</span></div>
        <div className="company-quick-actions"><button type="button" className="detail-button primary" onClick={() => onOpenCompanyMeeting?.(company.id)}>Open Meetings</button></div>
      </div>

      {meetingRow && <div className="detail-card"><MeetingComplianceSummary row={meetingRow} onRecordEarly={onRecordEarlyBoardMeeting} /></div>}

      <div className="detail-card">
        <h3 className="detail-card-title">Company overview</h3>
        <div className="detail-form-grid">
          <TextField label="Company Name" value={company.name ?? ""} onChange={(event) => update({ name: event.target.value })} aiField={{ name: "Company Name", companyId: company.id, detailKey: "company", path: "company.name" }} />
          <SelectField label="Status" value={company.status ?? "ACTIVE"} onChange={(event) => update({ status: event.target.value })} options={[{value:"ACTIVE",label:"Active"},{value:"TRANSFERRED",label:"Transferred"},{value:"UNDER_INCORPORATION",label:"Under incorporation"},{value:"DORMANT",label:"Dormant"},{value:"CLOSED",label:"Closed"},{value:"OTHER",label:"Other"}]} aiField={{ name: "Company status", companyId: company.id, detailKey: "company", path: "company.status" }} />
          <TextField label="Division" value={divisionName} disabled aiField={{ name: "Division", companyId: company.id, detailKey: "company", path: "company.division" }} />
          <TextField label="Company ID" value={company.id} disabled aiField={{ name: "Company ID", companyId: company.id, detailKey: "company", path: "company.id" }} />
          <DateField label="Incorporation Date" value={company.incorporationDate ?? ""} onChange={(event) => update({ incorporationDate: event.target.value })} aiField={{ name: "Incorporation date", companyId: company.id, detailKey: "company", path: "company.incorporationDate" }} />
          <SelectField label="Board Meeting Rule" value={company.meetingProfile ?? "STANDARD_120"} onChange={(event) => update({ meetingProfile: event.target.value })} options={[{value:"STANDARD_120",label:"Standard · 120 days"},{value:"HALF_YEAR_90",label:"Half-year pattern · 90 day gap"}]} aiField={{ name: "Board Meeting rule", companyId: company.id, detailKey: "company", path: "company.meetingProfile" }} />
        </div>
      </div>

      <div className="detail-card"><h3 className="detail-card-title">Key registered details</h3><div className="detail-stat-grid company-summary-grid">
        <div className="detail-stat"><span className="detail-stat-label">CIN</span><span className="company-stat-text">{master.cin || "Not recorded"}</span></div>
        <div className="detail-stat"><span className="detail-stat-label">PAN</span><span className="company-stat-text">{master.pan || "Not recorded"}</span></div>
        <div className="detail-stat"><span className="detail-stat-label">TAN</span><span className="company-stat-text">{master.tan || "Not recorded"}</span></div>
      </div></div>

      <div className="detail-card"><h3 className="detail-card-title">Company modules</h3><div className="company-module-grid">
        {COMPANY_SUB_DETAILS.map((module) => <button key={module.key} type="button" className="company-module-card" onClick={() => onSelect(getSubDetailId(company.id, module.key))}><span>{module.name}</span><span aria-hidden="true">→</span></button>)}
      </div></div>
    </div>
  );
}
