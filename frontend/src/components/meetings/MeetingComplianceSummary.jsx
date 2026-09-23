import StatusPill from "../ui/StatusPill";
import { formatDate } from "../ui/dataHelpers";
import "./meetingComplianceSummary.css";

function urgencyText(row) {
  if (row?.daysUntilDue == null) return "No calculated deadline";
  if (row.daysUntilDue < 0) return `${Math.abs(row.daysUntilDue)} days overdue`;
  if (row.daysUntilDue === 0) return "Due today";
  return `${row.daysUntilDue} days remaining`;
}

export function MeetingComplianceSummary({ row, onRecordEarly, compact = false }) {
  if (!row) return <div className="meeting-compliance-empty">Board Meeting compliance data is not loaded yet.</div>;
  return (
    <div className={`meeting-compliance-summary ${compact ? "compact" : ""}`}>
      <div className="meeting-compliance-main">
        <span className="meeting-compliance-eyebrow">BOARD MEETING COMPLIANCE</span>
        <strong>{formatDate(row.nextDueDate, "Not calculated")}</strong>
        <span className={`meeting-compliance-count severity-${row.severity || "low"}`}>{urgencyText(row)}</span>
      </div>
      <div className="meeting-compliance-stats">
        <div><span>Last held</span><b>{formatDate(row.lastBoardMeetingDate, "—")}{row.lastBoardMeetingEarly ? " · Early" : ""}</b></div>
        <div><span>Next scheduled</span><b>{formatDate(row.nextScheduledDate, "—")}</b></div>
        <div><span>Rule</span><b>{row.meetingProfile === "HALF_YEAR_90" ? "Half-year / 90d" : "120-day"}</b></div>
        <div><span>State</span><StatusPill value={row.status} /></div>
      </div>
      {row.canRecordEarly && onRecordEarly && <EarlyMeetingControl row={row} onRecordEarly={onRecordEarly} />}
    </div>
  );
}

export function EarlyMeetingControl({ row, onRecordEarly, compact = false }) {
  return (
    <details className={`meeting-early-control ${compact ? "compact" : ""}`} >
      <summary>Meeting held early?</summary>
      <div className="meeting-early-inner">
        <span>Record a date before the calculated deadline, within the same financial quarter. The new held date becomes the basis for the next deadline.</span>
        <div className="meeting-early-action" data-ai-field="true" data-ai-field-name="Early Board Meeting date" data-ai-company-id={row.companyId} data-ai-detail-key="meetings" data-ai-field-path="earlyBoardMeetingDate">
          <input type="date" min={row.lastBoardMeetingDate || row.incorporationDate || undefined} max={row.nextDueDate || undefined} defaultValue={""} onChange={(event) => { event.currentTarget.dataset.value = event.target.value; }} />
          <button type="button" className="detail-button primary" onClick={(event) => {
            const input = event.currentTarget.previousElementSibling;
            const value = input?.value;
            if (value) onRecordEarly(row.companyId, value);
          }}>Record early meeting</button>
        </div>
      </div>
    </details>
  );
}

export default MeetingComplianceSummary;
