import { useEffect, useState } from "react";
import FileField from "../documents/FileField";
import {
  DateField,
  NumberField,
  SelectField,
  TextField,
} from "../../03-shared/ui/FormField";
import { formatDate, meetingTypeLabel } from "../../03-shared/ui/dataHelpers";

export default function MeetingRow({
  meeting,
  companyId,
  focused,
  onUpdateMeeting,
  onDeleteMeeting,
  onUploadFiles,
  onDeleteFile,
  onOpenFile,
}) {
  const [draft, setDraft] = useState({
    meetingNumber: meeting.meetingNumber || "",
    scheduledDate: meeting.scheduledDate || "",
    heldDate: meeting.heldDate || "",
    status: meeting.status || "PLANNED",
    earlyConducted: Boolean(meeting.earlyConducted),
    noticeSentDate: meeting.noticeSentDate || "",
    agendaSentDate: meeting.agendaSentDate || "",
    attendanceDate: meeting.attendanceDate || "",
    minutesCirculatedDate: meeting.minutesCirculatedDate || "",
    commentsReceivedDate: meeting.commentsReceivedDate || "",
    finalMinutesDate: meeting.finalMinutesDate || "",
    minutesSignedDate: meeting.minutesSignedDate || "",
    signedMinutesCirculatedDate: meeting.signedMinutesCirculatedDate || "",
    notes: meeting.notes || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      meetingNumber: meeting.meetingNumber || "",
      scheduledDate: meeting.scheduledDate || "",
      heldDate: meeting.heldDate || "",
      status: meeting.status || "PLANNED",
      earlyConducted: Boolean(meeting.earlyConducted),
      noticeSentDate: meeting.noticeSentDate || "",
      agendaSentDate: meeting.agendaSentDate || "",
      attendanceDate: meeting.attendanceDate || "",
      minutesCirculatedDate: meeting.minutesCirculatedDate || "",
      commentsReceivedDate: meeting.commentsReceivedDate || "",
      finalMinutesDate: meeting.finalMinutesDate || "",
      minutesSignedDate: meeting.minutesSignedDate || "",
      signedMinutesCirculatedDate: meeting.signedMinutesCirculatedDate || "",
      notes: meeting.notes || "",
    });
  }, [meeting]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await onUpdateMeeting(companyId, meeting.id, {
        ...draft,
        meetingNumber: draft.meetingNumber || null,
        heldDate:
          draft.status === "HELD"
            ? draft.heldDate || draft.scheduledDate || null
            : draft.heldDate || null,
      });
    } finally {
      setSaving(false);
    }
  }

  const workflow =
    meeting.type === "BOARD"
      ? [
          ["Notice", meeting.noticeSentDate],
          ["Agenda", meeting.agendaSentDate],
          ["Draft minutes", meeting.minutesCirculatedDate],
          ["Final minutes", meeting.finalMinutesDate],
          ["Signed", meeting.minutesSignedDate],
          ["Signed copy circulated", meeting.signedMinutesCirculatedDate],
        ]
      : [];

  const aiPath = (field) => `meeting.${meeting.id}.${field}`;

  return (
    <article
      className={`meeting-record ${focused ? "focused" : ""}`}
      id={`meeting-${meeting.id}`}
      data-ai-meeting-id={meeting.id}
    >
      <div className="meeting-record-head">
        <div className="meeting-record-title">
          <span
            className={`meeting-type-pill meeting-type-${meeting.type.toLowerCase()}`}
          >
            {meeting.type}
          </span>
          <strong>{meetingTypeLabel(meeting.type)}</strong>
          <span className="meeting-number-label">
            #{meeting.meetingNumber || "—"}
          </span>
        </div>
        <div className="meeting-record-actions">
          <span
            className={`meeting-status-pill status-${meeting.status.toLowerCase()}`}
          >
            {meeting.status.replaceAll("_", " ")}
          </span>
          <button
            type="button"
            className="meeting-delete-button"
            onClick={() => onDeleteMeeting(companyId, meeting.id)}
            title="Delete meeting"
            aria-label="Delete meeting"
          >
            ×
          </button>
        </div>
      </div>

      <div className="meeting-record-grid">
        <NumberField
          label="Meeting no."
          min="1"
          value={draft.meetingNumber}
          onChange={(event) => updateField("meetingNumber", event.target.value)}
          aiField={{
            name: "Meeting number",
            companyId,
            detailKey: "meetings",
            path: aiPath("meetingNumber"),
          }}
        />
        <DateField
          label="Scheduled date"
          value={draft.scheduledDate}
          onChange={(event) => updateField("scheduledDate", event.target.value)}
          aiField={{
            name: "Scheduled meeting date",
            companyId,
            detailKey: "meetings",
            path: aiPath("scheduledDate"),
          }}
        />
        <DateField
          label="Held date"
          value={draft.heldDate}
          onChange={(event) => updateField("heldDate", event.target.value)}
          aiField={{
            name: "Held meeting date",
            companyId,
            detailKey: "meetings",
            path: aiPath("heldDate"),
          }}
        />
        <SelectField
          label="Status"
          value={draft.status}
          onChange={(event) => updateField("status", event.target.value)}
          options={[
            { value: "PLANNED", label: "Planned" },
            { value: "HELD", label: "Held" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
          aiField={{
            name: "Meeting status",
            companyId,
            detailKey: "meetings",
            path: aiPath("status"),
          }}
        />
      </div>

      {draft.status === "HELD" &&
        draft.heldDate &&
        draft.scheduledDate &&
        draft.heldDate < draft.scheduledDate && (
          <label className="meeting-early-confirmation">
            <input
              type="checkbox"
              checked={draft.earlyConducted}
              onChange={(event) =>
                updateField("earlyConducted", event.target.checked)
              }
            />
            Confirm this meeting was held before its scheduled date
          </label>
        )}

      {workflow.length > 0 && (
        <div className="meeting-workflow-strip">
          {workflow.map(([label, date]) => (
            <span key={label} className={date ? "done" : "pending"}>
              <b>{label}</b>
              {date ? formatDate(date) : "Pending"}
            </span>
          ))}
        </div>
      )}

      <div className="meeting-secondary-dates">
        <DateField
          label="Notice sent"
          value={draft.noticeSentDate}
          onChange={(event) =>
            updateField("noticeSentDate", event.target.value)
          }
          aiField={{
            name: "Notice sent date",
            companyId,
            detailKey: "meetings",
            path: aiPath("noticeSentDate"),
          }}
        />
        <DateField
          label="Agenda sent"
          value={draft.agendaSentDate}
          onChange={(event) =>
            updateField("agendaSentDate", event.target.value)
          }
          aiField={{
            name: "Agenda sent date",
            companyId,
            detailKey: "meetings",
            path: aiPath("agendaSentDate"),
          }}
        />
        <DateField
          label="Attendance"
          value={draft.attendanceDate}
          onChange={(event) =>
            updateField("attendanceDate", event.target.value)
          }
          aiField={{
            name: "Attendance date",
            companyId,
            detailKey: "meetings",
            path: aiPath("attendanceDate"),
          }}
        />
        <DateField
          label="Draft circulated"
          value={draft.minutesCirculatedDate}
          onChange={(event) =>
            updateField("minutesCirculatedDate", event.target.value)
          }
          aiField={{
            name: "Draft minutes circulated date",
            companyId,
            detailKey: "meetings",
            path: aiPath("minutesCirculatedDate"),
          }}
        />
        <DateField
          label="Comments received"
          value={draft.commentsReceivedDate}
          onChange={(event) =>
            updateField("commentsReceivedDate", event.target.value)
          }
          aiField={{
            name: "Comments received date",
            companyId,
            detailKey: "meetings",
            path: aiPath("commentsReceivedDate"),
          }}
        />
        <DateField
          label="Final minutes"
          value={draft.finalMinutesDate}
          onChange={(event) =>
            updateField("finalMinutesDate", event.target.value)
          }
          aiField={{
            name: "Final minutes date",
            companyId,
            detailKey: "meetings",
            path: aiPath("finalMinutesDate"),
          }}
        />
        <DateField
          label="Minutes signed"
          value={draft.minutesSignedDate}
          onChange={(event) => updateField("minutesSignedDate", event.target.value)}
          aiField={{
            name: "Minutes signed date",
            companyId,
            detailKey: "meetings",
            path: aiPath("minutesSignedDate"),
          }}
        />
        <DateField
          label="Signed minutes circulated"
          value={draft.signedMinutesCirculatedDate}
          onChange={(event) =>
            updateField("signedMinutesCirculatedDate", event.target.value)
          }
          aiField={{
            name: "Signed minutes circulation date",
            companyId,
            detailKey: "meetings",
            path: aiPath("signedMinutesCirculatedDate"),
          }}
        />
      </div>

      <div className="meeting-record-footer">
        <TextField
          label="Notes"
          value={draft.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Optional internal note"
          aiField={{
            name: "Meeting notes",
            companyId,
            detailKey: "meetings",
            path: aiPath("notes"),
          }}
        />
        <button
          type="button"
          className="detail-button primary meeting-save-button"
          data-ai-ignore="true"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="meeting-document-block">
        <FileField
          label={`${meeting.type} documents`}
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
