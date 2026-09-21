import StatusPill from "../components/StatusPill";
import CompactTable from "../components/CompactTable";
import { getCompanyDirectors, getCompanyShareholders, firstPath, formatDate } from "../components/dataHelpers";
import "./masterDataDetails.css";

function MasterDataDetails({ company, updateCompanies }) {
  const master = company.master ?? {};
  const directors = getCompanyDirectors(company);
  const shareholders = getCompanyShareholders(company);
  const status = firstPath(company, ["status", "companyStatus", "master.status", "master.companyStatus", "lifecycle.status"], "Not recorded");

  function updateMasterField(field, value) {
    updateCompanies(company.id, (current) => ({ ...current, master: { ...(current.master ?? {}), [field]: value } }));
  }

  const directorColumns = [
    { key: "name", label: "Director", render: (row) => row.name ?? row.directorName ?? "—" },
    { key: "din", label: "DIN", render: (row) => row.din ?? row.DIN ?? "—" },
    { key: "designation", label: "Designation", render: (row) => row.designation ?? row.role ?? "—" },
    { key: "appointmentDate", label: "Appointed", render: (row) => formatDate(row.appointmentDate) },
    { key: "status", label: "Status", render: (row) => <StatusPill value={row.status} /> },
  ];

  const shareholderColumns = [
    { key: "name", label: "Shareholder", render: (row) => row.name ?? row.shareholderName ?? "—" },
    { key: "shares", label: "Shares", render: (row) => row.shares ?? row.numberOfShares ?? "—" },
    { key: "percentage", label: "Holding %", render: (row) => row.percentage ?? row.shareholdingPercentage ?? "—" },
    { key: "class", label: "Class", render: (row) => row.class ?? row.shareClass ?? "—" },
  ];

  return (
    <div className="detail-page master-data-details" data-ai-company-id={company.id} data-ai-detail-key="master-data">
      <div className="detail-header"><div className="detail-eyebrow">MASTER DATA</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Identity, governance and ownership at a glance</p></div>

      <div className="detail-card master-data-quick-grid">
        <div><span>Status</span><StatusPill value={status} /></div>
        <div><span>Incorporated</span><strong>{formatDate(company.incorporationDate)}</strong></div>
        <div><span>Directors</span><strong>{directors.length}</strong></div>
        <div><span>Shareholders</span><strong>{shareholders.length}</strong></div>
      </div>

      <div className="detail-card"><div className="detail-card-heading-row"><div><h3 className="detail-card-title">Registered identity</h3><p className="detail-card-caption">Core identifiers used across filings and correspondence.</p></div></div><div className="detail-form-grid">
        <div className="detail-field"><label htmlFor="master-company-name">Company Name</label><input id="master-company-name" value={company.name ?? ""} disabled /></div>
        <div className="detail-field"><label htmlFor="master-division">Division</label><input id="master-division" value={company.division === "umpp" ? "UMPP" : "ITP"} disabled /></div>
        {[["cin", "CIN"], ["pan", "PAN"], ["gstin", "GSTIN"], ["tan", "TAN"], ["email", "Email"], ["companyType", "Company Type"]].map(([field, label]) => <div className="detail-field" key={field}><label htmlFor={`master-${field}`}>{label}</label><input id={`master-${field}`} value={master[field] ?? company[field] ?? ""} onChange={(event) => updateMasterField(field, event.target.value)} /></div>)}
      </div></div>

      <div className="detail-card"><div className="detail-card-heading-row"><div><h3 className="detail-card-title">Directors</h3><p className="detail-card-caption">Current and historical director information from the repository.</p></div><span className="data-count-badge">{directors.length}</span></div><CompactTable columns={directorColumns} rows={directors} empty="Director records will appear here once imported." /></div>

      <div className="detail-card"><div className="detail-card-heading-row"><div><h3 className="detail-card-title">Shareholding</h3><p className="detail-card-caption">Keep ownership details compact; use the register for full history.</p></div><span className="data-count-badge">{shareholders.length}</span></div><CompactTable columns={shareholderColumns} rows={shareholders} empty="Shareholder records will appear here once imported." /></div>
    </div>
  );
}
export default MasterDataDetails;
