import { useMemo, useState } from "react";
import "./boardMeetingOverview.css";

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function statusLabel(value) {
  return String(value || "ACTIVE").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function BoardRow({ row, onRecordEarly, onOpenMeeting }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveEarly() {
    if (!date || saving) return;
    setSaving(true);
    try {
      await onRecordEarly(row.companyId, date);
      setEditing(false);
      setDate("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bm-dashboard-row">
      <div className="bm-company-cell">
        <strong>{row.companyName}</strong>
        <span>{row.division?.toUpperCase()} · {statusLabel(row.status)}</span>
      </div>
      <div className="bm-date-cell">
        <span>{formatDate(row.lastBoardMeetingDate)}</span>
        <small>last held</small>
      </div>
      <div className={`bm-due-cell severity-${row.severity || "low"}`}>
        <span>{formatDate(row.nextDueDate)}</span>
        <small>{row.daysUntilDue < 0 ? `${Math.abs(row.daysUntilDue)}d overdue` : `${row.daysUntilDue}d remaining`}</small>
      </div>
      <div className="bm-action-cell">
        {editing ? (
          <div className="bm-inline-action">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} min={row.lastBoardMeetingDate || undefined} max={row.nextDueDate || undefined} />
            <button type="button" className="bm-save-button" onClick={saveEarly} disabled={!date || saving}>{saving ? "Saving…" : "Record"}</button>
            <button type="button" className="bm-cancel-button" onClick={() => { setEditing(false); setDate(""); }}>×</button>
          </div>
        ) : (
          <>
            <button type="button" className="bm-open-button" onClick={() => onOpenMeeting(row.companyId)}>Open</button>
            {row.canRecordEarly && <button type="button" className="bm-early-button" onClick={() => setEditing(true)}>Held early</button>}
          </>
        )}
      </div>
    </div>
  );
}

export default function BoardMeetingOverview({ rows = [], onRecordEarly, onOpenMeeting }) {
  const [division, setDivision] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => rows.filter((row) => {
    if (division !== "ALL" && row.division !== division) return false;
    if (status !== "ALL" && String(row.status || "ACTIVE").toUpperCase() !== status) return false;
    return true;
  }), [rows, division, status]);

  const urgent = rows.filter((row) => row.severity === "critical" || row.severity === "high").length;
  const upcoming = rows.filter((row) => row.daysUntilDue >= 0 && row.daysUntilDue <= 30).length;

  return (
    <div className="detail-card bm-dashboard-card">
      <div className="bm-dashboard-header">
        <div>
          <h3 className="detail-card-title">Board Meeting Pulse</h3>
          <p>Next due date is calculated from the latest held Board Meeting. Recording an early meeting resets the next due date from the new held date.</p>
        </div>
        <div className="bm-kpi-strip">
          <span><b>{upcoming}</b> due in 30d</span>
          <span className={urgent ? "is-urgent" : ""}><b>{urgent}</b> action</span>
        </div>
      </div>

      <div className="bm-dashboard-filters">
        <select value={division} onChange={(event) => setDivision(event.target.value)} aria-label="Division filter">
          <option value="ALL">All divisions</option>
          <option value="umpp">UMPP</option>
          <option value="itp">ITP</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status filter">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="UNDER_INCORPORATION">Under incorporation</option>
          <option value="DORMANT">Dormant</option>
          <option value="CLOSED">Closed</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="bm-dashboard-list">
        {filtered.map((row) => <BoardRow key={row.companyId} row={row} onRecordEarly={onRecordEarly} onOpenMeeting={onOpenMeeting} />)}
        {filtered.length === 0 && <div className="bm-dashboard-empty">No companies match the selected filters.</div>}
      </div>
    </div>
  );
}
