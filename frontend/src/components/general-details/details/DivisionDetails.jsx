import { useMemo, useState } from "react";
import { COMPANY_STATUS_FILTERS } from "../../../config/treeConfig";
import { formatDate, labelFromStatus } from "../../ui/dataHelpers";
import "./divisionDetails.css";

function DivisionDetails({ division, companies, onSelect, onOpenCompanyMeeting, meetingDashboard }) {
  const [status, setStatus] = useState("ALL");
  const divisionCompanies = companies.filter((company) => company.division === division);
  const dashboardRows = (meetingDashboard?.companies || []).filter((row) => row.division === division);
  const dashboardMap = new Map(dashboardRows.map((row) => [row.companyId, row]));
  const filteredCompanies = useMemo(() => divisionCompanies.filter((company) => status === "ALL" || String(company.status || "ACTIVE").toUpperCase() === status), [divisionCompanies, status]);
  const divisionName = division === "umpp" ? "UMPP" : "ITP";
  const activeCount = divisionCompanies.filter((company) => String(company.status || "ACTIVE").toUpperCase() === "ACTIVE").length;
  const transferredCount = divisionCompanies.filter((company) => String(company.status || "ACTIVE").toUpperCase() === "TRANSFERRED").length;

  return (
    <div className="detail-page division-details">
      <div className="detail-header">
        <div className="detail-eyebrow">DIVISION</div>
        <h2 className="detail-title">{divisionName}</h2>
        <p className="detail-subtitle">All companies, lifecycle status and Board Meeting pulse</p>
      </div>

      <div className="detail-stat-grid division-kpis">
        <div className="detail-stat"><span className="detail-stat-label">Companies</span><span className="detail-stat-value">{divisionCompanies.length}</span></div>
        <div className="detail-stat"><span className="detail-stat-label">Active</span><span className="detail-stat-value">{activeCount}</span></div>
        <div className="detail-stat"><span className="detail-stat-label">Transferred</span><span className="detail-stat-value">{transferredCount}</span></div>
      </div>

      <div className="detail-card">
        <div className="division-list-toolbar" data-ai-ignore="true">
          <div>
            <h3 className="detail-card-title">Companies</h3>
            <span className="division-list-caption">Filter the full division register without leaving the division.</span>
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Company status filter">
            {COMPANY_STATUS_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
          </select>
        </div>

        {filteredCompanies.length === 0 ? (
          <p className="division-empty">No companies match this status filter.</p>
        ) : (
          <div className="division-company-list">
            {filteredCompanies.map((company) => {
              const meeting = dashboardMap.get(company.id);
              return (
                <div className="division-company-row" key={company.id}>
                  <button type="button" className="division-company-main" onClick={() => onSelect(company.id)}>
                    <span>
                      <strong>{company.name}</strong>
                      <small>{labelFromStatus(company.status)} · {company.id}</small>
                    </span>
                  </button>
                  <div className={`division-meeting-pulse severity-${meeting?.severity || "low"}`}>
                    <span>{meeting?.nextDueDate ? formatDate(meeting.nextDueDate) : "No due date"}</span>
                    <small>{meeting?.daysUntilDue == null ? "—" : meeting.daysUntilDue < 0 ? `${Math.abs(meeting.daysUntilDue)}d overdue` : `${meeting.daysUntilDue}d left`}</small>
                  </div>
                  <button type="button" className="division-row-action" onClick={() => onOpenCompanyMeeting?.(company.id)} title="Open Board Meetings">Meetings →</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DivisionDetails;
