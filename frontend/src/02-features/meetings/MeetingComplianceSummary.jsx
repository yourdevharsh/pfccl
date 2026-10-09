import StatusPill from "../../03-shared/ui/StatusPill";
import { formatDate } from "../../03-shared/ui/dataHelpers";
import "./meetingComplianceSummary.css";

function urgencyText(row) {
  if (row?.daysUntilDue == null) return "No calculated deadline";
  if (row.daysUntilDue < 0) return `${Math.abs(row.daysUntilDue)} days overdue`;
  if (row.daysUntilDue === 0) return "Due today";
  return `${row.daysUntilDue} days remaining`;
}

export function MeetingComplianceSummary({
  row,
  onRecordEarly,
  compact = false,
}) {
  if (!row)
    return (
      <div className="meeting-compliance-empty">
        Board Meeting compliance data is not loaded yet.
      </div>
    );
  return (
    <div
      className={`meeting-compliance-summary ${compact ? "compact" : ""}`}
      data-ai-section="true"
      data-ai-company-id={row.companyId}
      data-ai-detail-key="meetings"
      data-ai-section-name="Board Meeting Compliance"
    >
      <div
        className="meeting-compliance-main"
        data-ai-field="true"
        data-ai-field-name="Next Board Meeting due date"
        data-ai-company-id={row.companyId}
        data-ai-detail-key="meetings"
        data-ai-field-path="compliance.nextDueDate"
      >
        <span className="meeting-compliance-eyebrow">
          BOARD MEETING COMPLIANCE
        </span>
        <strong>{formatDate(row.nextDueDate, "Not calculated")}</strong>
        <span
          className={`meeting-compliance-count severity-${row.severity || "low"}`}
        >
          {urgencyText(row)}
        </span>
      </div>
      <div className="meeting-compliance-stats">
        <div
          data-ai-field="true"
          data-ai-field-name="Last Board Meeting date"
          data-ai-company-id={row.companyId}
          data-ai-detail-key="meetings"
          data-ai-field-path="compliance.lastBoardMeetingDate"
        >
          <span>Last held</span>
          <b>
            {formatDate(row.lastBoardMeetingDate, "—")}
            {row.lastBoardMeetingEarly ? " · Early" : ""}
          </b>
        </div>
        <div
          data-ai-field="true"
          data-ai-field-name="Next AGM due date"
          data-ai-company-id={row.companyId}
          data-ai-detail-key="meetings"
          data-ai-field-path="compliance.nextAgmDueDate"
        >
          <span>Next AGM due</span>
          <b>{formatDate(row.nextAgmDueDate, "Not calculated")}</b>
        </div>
        <div
          data-ai-field="true"
          data-ai-field-name="Board Meetings required in this period"
          data-ai-company-id={row.companyId}
          data-ai-detail-key="meetings"
          data-ai-field-path="compliance.boardMeetingsThisPeriod"
        >
          <span>Board Meetings ({row.boardMeetingPeriodLabel})</span>
          <b>
            {row.boardMeetingsThisPeriod ?? 0} / {row.boardMeetingFrequencyRequirement ?? 4} minimum
          </b>
        </div>
        <div
          data-ai-field="true"
          data-ai-field-name="Next scheduled Board Meeting date"
          data-ai-company-id={row.companyId}
          data-ai-detail-key="meetings"
          data-ai-field-path="compliance.nextScheduledDate"
        >
          <span>Next scheduled</span>
          <b>{formatDate(row.nextScheduledDate, "—")}</b>
        </div>
        <div
          data-ai-field="true"
          data-ai-field-name="Board Meeting compliance rule"
          data-ai-company-id={row.companyId}
          data-ai-detail-key="meetings"
          data-ai-field-path="compliance.meetingProfile"
        >
          <span>Rule</span>
          <b>
            {row.meetingProfile === "HALF_YEAR_90"
              ? "One per half-year / 90d minimum gap"
              : "120-day"}
          </b>
        </div>
        <div
          data-ai-field="true"
          data-ai-field-name="Company monitoring state"
          data-ai-company-id={row.companyId}
          data-ai-detail-key="meetings"
          data-ai-field-path="compliance.status"
        >
          <span>State</span>
          <StatusPill value={row.status} />
        </div>
      </div>
      {row.canRecordEarly && onRecordEarly && (
        <EarlyMeetingControl row={row} onRecordEarly={onRecordEarly} />
      )}
    </div>
  );
}

export function EarlyMeetingControl({ row, onRecordEarly, compact = false }) {
  return (
    <details className={`meeting-early-control ${compact ? "compact" : ""}`}>
      <summary>Meeting held early?</summary>
      <div className="meeting-early-inner">
        <span>
          Record a date before the calculated statutory deadline. The next
          interval is then calculated from the meeting actually held.
        </span>
        <div
          className="meeting-early-action"
          data-ai-field="true"
          data-ai-field-name="Early Board Meeting date"
          data-ai-company-id={row.companyId}
          data-ai-detail-key="meetings"
          data-ai-field-path="earlyBoardMeetingDate"
        >
          <input
            type="date"
            min={row.earliestEarlyMeetingDate || undefined}
            max={row.latestEarlyMeetingDate || undefined}
            defaultValue={""}
            onChange={(event) => {
              event.currentTarget.dataset.value = event.target.value;
            }}
          />
          <button
            type="button"
            className="detail-button primary"
            onClick={(event) => {
              const input = event.currentTarget.previousElementSibling;
              const value = input?.value;
              if (value) onRecordEarly(row.companyId, value);
            }}
          >
            Record early meeting
          </button>
        </div>
      </div>
    </details>
  );
}

export default MeetingComplianceSummary;
