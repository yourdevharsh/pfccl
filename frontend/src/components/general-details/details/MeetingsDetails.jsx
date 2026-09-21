import { useEffect, useMemo, useState } from "react";
import FileField from "../components/FileField";
import "./meetingsDetails.css";

const FILTERS = [
  ["ALL", "All"],
  ["BOARD", "Board"],
  ["AGM", "AGM"],
  ["EGM", "EGM"],
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function statusLabel(value) {
  return String(value || "PLANNED").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function MeetingRow({ meeting, companyId, onUpdateMeeting, onDeleteMeeting, onUploadFiles, onDeleteFile, onOpenFile, focused }) {
  const [draft, setDraft] = useState({
    meetingNumber: meeting.meetingNumber || "",
    scheduledDate: meeting.scheduledDate || "",
    heldDate: meeting.heldDate || "",
    status: meeting.status || "PLANNED",
    noticeSentDate: meeting.noticeSentDate || "",
    agendaSentDate: meeting.agendaSentDate || "",
    minutesCirculatedDate: meeting.minutesCirculatedDate || "",
    commentsReceivedDate: meeting.commentsReceivedDate || "",
    finalMinutesDate: meeting.finalMinutesDate || "",
    notes: meeting.notes || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!focused) return;
    const element = document.getElementById(`meeting-${meeting.id}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused, meeting.id]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await onUpdateMeeting(companyId, meeting.id, {
        ...draft,
        scheduledDate: draft.scheduledDate || null,
        heldDate: draft.heldDate || null,
        noticeSentDate: draft.noticeSentDate || null,
        agendaSentDate: draft.agendaSentDate || null,
        minutesCirculatedDate: draft.minutesCirculatedDate || null,
        commentsReceivedDate: draft.commentsReceivedDate || null,
        finalMinutesDate: draft.finalMinutesDate || null,
      });
    } finally {
      setSaving(false);
    }
  }

  const workflow = meeting.type === "BOARD" ? [
    ["Notice", meeting.noticeSentDate],
    ["Agenda", meeting.agendaSentDate],
    ["Draft", meeting.minutesCirculatedDate],
    ["Final", meeting.finalMinutesDate],
  ] : [];

  return (
    <article className={`meeting-record ${focused ? "focused" : ""}`} id={`meeting-${meeting.id}`}>
      <div className="meeting-record-head">
        <div className="meeting-record-title">
          <span className={`meeting-type-pill meeting-type-${meeting.type.toLowerCase()}`}>{meeting.type}</span>
          <strong>{meeting.type === "BOARD" ? "Board Meeting" : meeting.type}</strong>
          <span className="meeting-number-label">#{meeting.meetingNumber || "—"}</span>
        </div>
        <div className="meeting-record-actions">
          <span className={`meeting-status-pill status-${meeting.status.toLowerCase()}`}>{statusLabel(meeting.status)}</span>
          <button type="button" className="meeting-delete-button" onClick={() => onDeleteMeeting(companyId, meeting.id)} title="Delete meeting">×</button>
        </div>
      </div>

      <div className="meeting-record-grid">
        <div className="meeting-input-block"><label>Meeting no.</label><input type="number" min="1" value={draft.meetingNumber} onChange={(event) => updateField("meetingNumber", event.target.value)} /></div>
        <div className="meeting-input-block"><label>{meeting.type === "BOARD" ? "Scheduled date" : "Meeting date"}</label><input type="date" value={draft.scheduledDate} onChange={(event) => updateField("scheduledDate", event.target.value)} /></div>
        {meeting.type === "BOARD" && <div className="meeting-input-block"><label>Held date</label><input type="date" value={draft.heldDate} onChange={(event) => updateField("heldDate", event.target.value)} /></div>}
        <div className="meeting-input-block"><label>Status</label><select value={draft.status} onChange={(event) => updateField("status", event.target.value)}><option value="PLANNED">Planned</option><option value="HELD">Held</option><option value="CANCELLED">Cancelled</option></select></div>
      </div>

      {meeting.type === "BOARD" && (
        <div className="meeting-workflow-strip">
          {workflow.map(([label, date]) => <span key={label} className={date ? "done" : "pending"}><b>{label}</b>{date ? formatDate(date) : "Pending"}</span>)}
        </div>
      )}

      {meeting.type === "BOARD" && (
        <div className="meeting-secondary-dates">
          <div><label>Notice sent</label><input type="date" value={draft.noticeSentDate} onChange={(event) => updateField("noticeSentDate", event.target.value)} /></div>
          <div><label>Agenda sent</label><input type="date" value={draft.agendaSentDate} onChange={(event) => updateField("agendaSentDate", event.target.value)} /></div>
          <div><label>Draft circulated</label><input type="date" value={draft.minutesCirculatedDate} onChange={(event) => updateField("minutesCirculatedDate", event.target.value)} /></div>
          <div><label>Comments received</label><input type="date" value={draft.commentsReceivedDate} onChange={(event) => updateField("commentsReceivedDate", event.target.value)} /></div>
          <div><label>Final minutes</label><input type="date" value={draft.finalMinutesDate} onChange={(event) => updateField("finalMinutesDate", event.target.value)} /></div>
        </div>
      )}

      <div className="meeting-record-footer">
        <div className="meeting-note-input"><label>Notes</label><input value={draft.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Optional internal note" /></div>
        <button type="button" className="detail-button primary meeting-save-button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>

      <div className="meeting-document-block">
        <FileField
          label="Meeting documents"
          field={`meeting.${meeting.id}.documents`}
          detailKey="meetings"
          companyId={companyId}
          value={meeting.documents || []}
          onUpload={onUploadFiles}
          onDeleteFile={onDeleteFile}
          onOpenFile={onOpenFile}
        />
      </div>
    </article>
  );
}

export default function MeetingsDetails({ company, onOpenFile, onUploadFiles, onDeleteFile, meetingRecords = [], meetingFocus, onCreateMeeting, onUpdateMeeting, onDeleteMeeting }) {
  const [filter, setFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ type: "BOARD", meetingNumber: "", scheduledDate: "", heldDate: "", status: "PLANNED" });
  const [creating, setCreating] = useState(false);

  const sortedMeetings = useMemo(() => [...meetingRecords]
    .filter((meeting) => filter === "ALL" || meeting.type === filter)
    .sort((a, b) => String(b.heldDate || b.scheduledDate || "").localeCompare(String(a.heldDate || a.scheduledDate || "")), [filter]), [meetingRecords, filter]);

  const counts = useMemo(() => FILTERS.reduce((acc, [value]) => ({ ...acc, [value]: value === "ALL" ? meetingRecords.length : meetingRecords.filter((meeting) => meeting.type === value).length }), {}), [meetingRecords]);

  async function createMeeting() {
    if (!newMeeting.scheduledDate || creating) return;
    setCreating(true);
    try {
      await onCreateMeeting(company.id, {
        ...newMeeting,
        meetingNumber: newMeeting.meetingNumber || null,
        heldDate: newMeeting.status === "HELD" ? (newMeeting.heldDate || newMeeting.scheduledDate) : null,
      });
      setNewMeeting({ type: "BOARD", meetingNumber: "", scheduledDate: "", heldDate: "", status: "PLANNED" });
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="detail-page meetings-details" data-ai-company-id={company.id} data-ai-detail-key="meetings">
      <div className="detail-header"><div className="detail-eyebrow">MEETINGS</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Board Meetings, AGMs and EGMs — organized by date and workflow</p></div>

      <div className="detail-card meetings-summary-card">
        <div className="meetings-summary-item"><span>Board</span><strong>{counts.BOARD || 0}</strong></div>
        <div className="meetings-summary-item"><span>AGM</span><strong>{counts.AGM || 0}</strong></div>
        <div className="meetings-summary-item"><span>EGM</span><strong>{counts.EGM || 0}</strong></div>
        <div className="meetings-summary-item"><span>Total</span><strong>{counts.ALL || 0}</strong></div>
        <button type="button" className="detail-button primary meetings-add-button" onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close" : "+ Add meeting"}</button>
      </div>

      {showCreate && (
        <div className="detail-card meeting-create-card">
          <div className="meeting-create-head"><h3 className="detail-card-title">New Meeting</h3><span>Dates are stored in the meeting register and used by the reminder engine.</span></div>
          <div className="meeting-create-grid">
            <div className="meeting-input-block"><label>Type</label><select value={newMeeting.type} onChange={(event) => setNewMeeting((current) => ({ ...current, type: event.target.value }))}><option value="BOARD">Board</option><option value="AGM">AGM</option><option value="EGM">EGM</option></select></div>
            <div className="meeting-input-block"><label>Meeting no.</label><input type="number" min="1" value={newMeeting.meetingNumber} onChange={(event) => setNewMeeting((current) => ({ ...current, meetingNumber: event.target.value }))} placeholder="Auto" /></div>
            <div className="meeting-input-block"><label>Meeting date</label><input type="date" value={newMeeting.scheduledDate} onChange={(event) => setNewMeeting((current) => ({ ...current, scheduledDate: event.target.value }))} /></div>
            {newMeeting.type === "BOARD" && <div className="meeting-input-block"><label>Held date</label><input type="date" value={newMeeting.heldDate} onChange={(event) => setNewMeeting((current) => ({ ...current, heldDate: event.target.value }))} /></div>}
            <div className="meeting-input-block"><label>Status</label><select value={newMeeting.status} onChange={(event) => setNewMeeting((current) => ({ ...current, status: event.target.value }))}><option value="PLANNED">Planned</option><option value="HELD">Held</option></select></div>
            <div className="meeting-create-action"><button type="button" className="detail-button primary" onClick={createMeeting} disabled={!newMeeting.scheduledDate || creating}>{creating ? "Creating…" : "Create meeting"}</button></div>
          </div>
        </div>
      )}

      <div className="detail-card">
        <div className="meetings-list-toolbar">
          <div>
            <h3 className="detail-card-title">Meeting Register</h3>
            <span>Newest meeting first. Select a type to keep the register focused.</span>
          </div>
          <div className="meeting-filter-tabs">
            {FILTERS.map(([value, label]) => <button type="button" key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}<small>{counts[value] || 0}</small></button>)}
          </div>
        </div>

        <div className="meeting-register">
          {sortedMeetings.map((meeting) => (
            <MeetingRow
              key={meeting.id}
              meeting={meeting}
              companyId={company.id}
              focused={meetingFocus?.meetingId === meeting.id}
              onUpdateMeeting={onUpdateMeeting}
              onDeleteMeeting={onDeleteMeeting}
              onUploadFiles={onUploadFiles}
              onDeleteFile={onDeleteFile}
              onOpenFile={onOpenFile}
            />
          ))}
          {sortedMeetings.length === 0 && <div className="meeting-register-empty">No meetings of this type have been recorded yet.</div>}
        </div>
      </div>
    </div>
  );
}
