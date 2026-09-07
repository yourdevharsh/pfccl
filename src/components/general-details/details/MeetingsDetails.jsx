import FileField from "../components/FileField";
import { updateCompany } from "../../../utils/companyUpdates";
import "./meetingsDetails.css";

function MeetingsDetails({ company, updateCompanies, onOpenFile }) {
  const meetings = company.meetings ?? {};

  function updateMeetings(updater) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      meetings: updater(current.meetings ?? {}),
    }));
  }

  function updateFiles(path, value) {
    updateMeetings((current) => {
      const [section, field] = path;
      return {
        ...current,
        [section]: {
          ...(current[section] ?? {}),
          [field]: {
            ...(current[section]?.[field] ?? {}),
            files: value,
          },
        },
      };
    });
  }

  function updateMiscFiles(value) {
    updateMeetings((current) => ({
      ...current,
      misc: {
        ...(current.misc ?? {}),
        files: value,
      },
    }));
  }

  return (
    <div className="detail-page meetings-details">
      <div className="detail-header">
        <div className="detail-eyebrow">MEETINGS</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">Board and general meeting records</p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Board Meetings</h3>
        <div className="detail-form-grid">
          <div className="detail-field">
            <label htmlFor={`meeting-count-${company.id}`}>Number of Meetings</label>
            <input
              id={`meeting-count-${company.id}`}
              type="number"
              min="0"
              value={meetings.bm?.numberOfMeetings ?? 0}
              onChange={(event) =>
                updateMeetings((current) => ({
                  ...current,
                  bm: {
                    ...(current.bm ?? {}),
                    numberOfMeetings: Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="detail-field full-width">
            <FileField
              label="Minutes / Notes"
              value={meetings.bm?.minutes?.files ?? []}
              onChange={(value) => updateFiles(["bm", "minutes"], value)}
              onOpenFile={onOpenFile}
            />
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">General Meetings</h3>
        <div className="detail-form-grid">
          <div className="detail-field full-width">
            <FileField
              label="EGM"
              value={meetings.gm?.egm?.files ?? []}
              onChange={(value) => updateFiles(["gm", "egm"], value)}
              onOpenFile={onOpenFile}
            />
          </div>
          <div className="detail-field full-width">
            <FileField
              label="AGM"
              value={meetings.gm?.agm?.files ?? []}
              onChange={(value) => updateFiles(["gm", "agm"], value)}
              onOpenFile={onOpenFile}
            />
          </div>
          <div className="detail-field full-width">
            <FileField
              label="Miscellaneous"
              value={meetings.misc?.files ?? []}
              onChange={updateMiscFiles}
              onOpenFile={onOpenFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingsDetails;
