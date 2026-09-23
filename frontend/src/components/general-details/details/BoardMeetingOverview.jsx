import { useMemo, useState } from "react";
import { EarlyMeetingControl } from "../../meetings/MeetingComplianceSummary";
import StatusPill from "../../ui/StatusPill";
import { formatDate } from "../../ui/dataHelpers";
import "./boardMeetingOverview.css";

function BoardRow({ row, onRecordEarly, onOpenMeeting }) {
  return (
    <article className={`bm-dashboard-row severity-${row.severity || "low"}`} data-ai-field="true" data-ai-field-name={`${row.companyName} Board Meeting summary`} data-ai-company-id={row.companyId} data-ai-detail-key="meetings" data-ai-field-path="boardMeetingSummary">
      <div className="bm-company-cell">
        <strong>{row.companyName}</strong>
        <span>{row.division?.toUpperCase()} · <StatusPill value={row.status} /></span>
      </div>
      <div className="bm-date-cell">
        <span>{formatDate(row.lastBoardMeetingDate, "—")}</span>
        <small>{row.lastBoardMeetingEarly ? "last held · early" : "last held"}</small>
      </div>
      <div className="bm-due-cell">
        <span>{formatDate(row.nextDueDate, "Not calculated")}</span>
        <small>{row.daysUntilDue == null ? "No deadline" : row.daysUntilDue < 0 ? `${Math.abs(row.daysUntilDue)}d overdue` : `${row.daysUntilDue}d remaining`}</small>
      </div>
      <div className="bm-schedule-cell">
        <span>{formatDate(row.nextScheduledDate, "—")}</span>
        <small>next scheduled</small>
      </div>
      <div className="bm-action-cell" data-ai-ignore="true">
        {row.canRecordEarly && <EarlyMeetingControl row={row} onRecordEarly={onRecordEarly} compact />}
        <button type="button" className="bm-open-button" onClick={() => onOpenMeeting(row.companyId)}>Open Meetings</button>
      </div>
    </article>
  );
}

export default function BoardMeetingOverview({ rows = [], onRecordEarly, onOpenMeeting }) {
  const [division, setDivision] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [showCompliance, setShowCompliance] = useState(false);
  const filtered = useMemo(
    () => rows.filter((row) => (division === "ALL" || row.division === division) && (status === "ALL" || String(row.status || "ACTIVE").toUpperCase() === status)),
    [rows, division, status],
  );
  const actionRows = filtered.filter((row) => row.daysUntilDue != null && row.daysUntilDue <= 14 && !["TRANSFERRED", "CLOSED"].includes(String(row.status || "").toUpperCase()));
  const upcoming = filtered.filter((row) => row.daysUntilDue != null && row.daysUntilDue >= 0 && row.daysUntilDue <= 30).length;

  return (
    <div className="detail-card bm-dashboard-card" data-ai-section="true" data-ai-section-name="Board Meeting Control Centre">
      <div className="bm-dashboard-header">
        <div>
          <h3 className="detail-card-title">Board Meeting control centre</h3>
          <p>See the next calculated due date for every company. If a Board Meeting is held early within the due quarter, use “Held early” and the server recalculates the following deadline from the new held date.</p>
        </div>
        <div className="bm-kpi-strip" data-ai-ignore="true">
          <span><b>{actionRows.length}</b> action</span>
          <span><b>{upcoming}</b> due in 30d</span>
          <button type="button" className="bm-open-button" onClick={() => setShowCompliance((value) => !value)}>{showCompliance ? "Hide rule" : "How due dates work"}</button>
        </div>
      </div>

      {showCompliance && <div className="bm-rule-note" data-ai-ignore="true">Standard profile: the next deadline is calculated from the latest held Board Meeting and the applicable maximum interval. The first Board Meeting uses the incorporation date + 30 days. Early meetings must be before the calculated deadline and in the same financial quarter; the server validates the change.</div>}

      <div className="bm-dashboard-filters" data-ai-ignore="true">
        <select value={division} onChange={(event) => setDivision(event.target.value)} aria-label="Division filter">
          <option value="ALL">All divisions</option><option value="umpp">UMPP</option><option value="itp">ITP</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status filter">
          <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="TRANSFERRED">Transferred</option><option value="UNDER_INCORPORATION">Under incorporation</option><option value="DORMANT">Dormant</option><option value="CLOSED">Closed</option><option value="OTHER">Other</option>
        </select>
      </div>

      <div className="bm-dashboard-list">
        {filtered.map((row) => <BoardRow key={row.companyId} row={row} onRecordEarly={onRecordEarly} onOpenMeeting={onOpenMeeting} />)}
        {filtered.length === 0 && <div className="bm-dashboard-empty">No companies match the selected filters.</div>}
      </div>
    </div>
  );
}
