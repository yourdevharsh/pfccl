import { useMemo, useState } from "react";
import MeetingComplianceSummary from "../../../../../02-features/meetings/MeetingComplianceSummary";
import MeetingRow from "../../../../../02-features/meetings/MeetingRow";
import {
  DateField,
  NumberField,
  SelectField,
} from "../../../../../03-shared/ui/FormField";
import "./meetingsDetails.css";

const FILTERS = [
  ["ALL", "All"],
  ["BOARD", "Board"],
  ["AGM", "AGM"],
  ["EGM", "EGM"],
];

export default function MeetingsDetails({
  company,
  onOpenFile,
  onUploadFiles,
  onDeleteFile,
  meetingRecords = [],
  meetingFocus,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  meetingRow,
  onRecordEarlyBoardMeeting,
}) {
  const [filter, setFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    type: "BOARD",
    meetingNumber: "",
    scheduledDate: "",
    heldDate: "",
    status: "PLANNED",
    earlyConducted: false,
  });
  const [creating, setCreating] = useState(false);
  const sortedMeetings = useMemo(
    () =>
      [...meetingRecords]
        .filter((meeting) => filter === "ALL" || meeting.type === filter)
        .sort(
          (a, b) =>
            String(b.heldDate || b.scheduledDate || "").localeCompare(
              String(a.heldDate || a.scheduledDate || ""),
            ),
        ),
    [meetingRecords, filter],
  );
  const counts = useMemo(
    () =>
      FILTERS.reduce(
        (acc, [value]) => ({
          ...acc,
          [value]:
            value === "ALL"
              ? meetingRecords.length
              : meetingRecords.filter((meeting) => meeting.type === value)
                  .length,
        }),
        {},
      ),
    [meetingRecords],
  );

  async function createMeeting() {
    if (
      (!newMeeting.scheduledDate &&
        !(newMeeting.status === "HELD" && newMeeting.heldDate)) ||
      creating
    )
      return;
    setCreating(true);
    try {
      await onCreateMeeting(company.id, {
        ...newMeeting,
        meetingNumber: newMeeting.meetingNumber || null,
        heldDate:
          newMeeting.status === "HELD"
            ? newMeeting.heldDate || newMeeting.scheduledDate
            : newMeeting.heldDate || null,
      });
      setNewMeeting({
        type: "BOARD",
        meetingNumber: "",
        scheduledDate: "",
        heldDate: "",
        status: "PLANNED",
        earlyConducted: false,
      });
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="detail-page meetings-details"
      data-ai-company-id={company.id}
      data-ai-detail-key="meetings"
      data-ai-section="true"
      data-ai-section-name="Meetings"
    >
      <div className="detail-header">
        <div className="detail-eyebrow">MEETINGS</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">
          Board Meetings, AGMs and EGMs — organized by date, workflow and
          compliance deadline.
        </p>
      </div>

      {meetingRow && (
        <div className="detail-card">
          <MeetingComplianceSummary
            row={meetingRow}
            onRecordEarly={onRecordEarlyBoardMeeting}
          />
        </div>
      )}

      <div className="detail-card meetings-summary-card">
        <div className="meetings-summary-item">
          <span>Board</span>
          <strong>{counts.BOARD || 0}</strong>
        </div>
        <div className="meetings-summary-item">
          <span>AGM</span>
          <strong>{counts.AGM || 0}</strong>
        </div>
        <div className="meetings-summary-item">
          <span>EGM</span>
          <strong>{counts.EGM || 0}</strong>
        </div>
        <div className="meetings-summary-item">
          <span>Total</span>
          <strong>{counts.ALL || 0}</strong>
        </div>
        <button
          type="button"
          data-ai-ignore="true"
          className="detail-button primary meetings-add-button"
          onClick={() => setShowCreate((current) => !current)}
        >
          {showCreate ? "Close" : "+ Add meeting"}
        </button>
      </div>

      {showCreate && (
        <div className="detail-card meeting-create-card">
          <div className="meeting-create-head">
            <h3 className="detail-card-title">New meeting</h3>
            <span>
              Choose the meeting date. Derived compliance reminders are
              calculated by the server.
            </span>
          </div>
          <div className="meeting-create-grid">
            <SelectField
              label="Type"
              value={newMeeting.type}
              onChange={(event) =>
                setNewMeeting((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
              options={[
                { value: "BOARD", label: "Board" },
                { value: "AGM", label: "AGM" },
                { value: "EGM", label: "EGM" },
              ]}
              aiField={{
                name: "Meeting type",
                companyId: company.id,
                detailKey: "meetings",
                path: "new.type",
              }}
            />
            <NumberField
              label="Meeting no."
              min="1"
              value={newMeeting.meetingNumber}
              onChange={(event) =>
                setNewMeeting((current) => ({
                  ...current,
                  meetingNumber: event.target.value,
                }))
              }
              placeholder="Auto"
              aiField={{
                name: "Meeting number",
                companyId: company.id,
                detailKey: "meetings",
                path: "new.meetingNumber",
              }}
            />
            <DateField
              label="Meeting date"
              value={newMeeting.scheduledDate}
              onChange={(event) =>
                setNewMeeting((current) => ({
                  ...current,
                  scheduledDate: event.target.value,
                }))
              }
              aiField={{
                name: "Meeting date",
                companyId: company.id,
                detailKey: "meetings",
                path: "new.scheduledDate",
              }}
            />
            <DateField
              label="Held date"
              value={newMeeting.heldDate}
              onChange={(event) =>
                setNewMeeting((current) => ({
                  ...current,
                  heldDate: event.target.value,
                }))
              }
              aiField={{
                name: "Held date",
                companyId: company.id,
                detailKey: "meetings",
                path: "new.heldDate",
              }}
            />
            {newMeeting.status === "HELD" &&
              newMeeting.heldDate &&
              newMeeting.scheduledDate &&
              newMeeting.heldDate < newMeeting.scheduledDate && (
                <label className="meeting-early-confirmation">
                  <input
                    type="checkbox"
                    checked={newMeeting.earlyConducted}
                    onChange={(event) =>
                      setNewMeeting((current) => ({
                        ...current,
                        earlyConducted: event.target.checked,
                      }))
                    }
                  />
                  Confirm early-held date
                </label>
              )}
            <SelectField
              label="Status"
              value={newMeeting.status}
              onChange={(event) =>
                setNewMeeting((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              options={[
                { value: "PLANNED", label: "Planned" },
                { value: "HELD", label: "Held" },
              ]}
              aiField={{
                name: "Meeting status",
                companyId: company.id,
                detailKey: "meetings",
                path: "new.status",
              }}
            />
            <div className="meeting-create-action" data-ai-ignore="true">
              <button
                type="button"
                className="detail-button primary"
                onClick={createMeeting}
                disabled={
                  (!newMeeting.scheduledDate &&
                    !(newMeeting.status === "HELD" && newMeeting.heldDate)) ||
                  creating
                }
              >
                {creating ? "Creating…" : "Create meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-card">
        <div className="meetings-list-toolbar" data-ai-ignore="true">
          <div>
            <h3 className="detail-card-title">Meeting register</h3>
            <span>
              Newest date first. Open a record to update workflow and documents.
            </span>
          </div>
          <div className="meeting-filter-tabs">
            {FILTERS.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {label}
                <small>{counts[value] || 0}</small>
              </button>
            ))}
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
          {sortedMeetings.length === 0 && (
            <div className="meeting-register-empty">
              No meetings of this type have been recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
