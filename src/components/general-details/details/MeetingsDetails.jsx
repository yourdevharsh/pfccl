import { updateCompany } from "../../../utils/companyUpdates";
import "./meetingsDetails.css";

function MeetingsDetails({ company, updateCompanies }) {
  const meetings = company.meetings ?? {};

  function updateMeetings(updater) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      meetings: updater(current.meetings ?? {}),
    }));
  }

  function updateNotes(path, value) {
    updateMeetings((current) => {
      const [section, field] = path;
      return {
        ...current,
        [section]: {
          ...(current[section] ?? {}),
          [field]: {
            ...(current[section]?.[field] ?? {}),
            notes: value,
          },
        },
      };
    });
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
            <label htmlFor="meeting-agendas">Number of Agendas</label>
            <input
              id="meeting-agendas"
              type="number"
              min="0"
              value={meetings.bm?.numberOfAgendas ?? 0}
              onChange={(event) =>
                updateMeetings((current) => ({
                  ...current,
                  bm: {
                    ...(current.bm ?? {}),
                    numberOfAgendas: Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="detail-field full-width">
            <label htmlFor="meeting-minutes">Minutes / Notes</label>
            <textarea
              id="meeting-minutes"
              value={meetings.bm?.minutes?.notes ?? ""}
              onChange={(event) => updateNotes(["bm", "minutes"], event.target.value)}
              placeholder="Enter board meeting minutes or a reference to stored minutes."
            />
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">General Meetings</h3>
        <div className="detail-form-grid">
          <div className="detail-field full-width">
            <label htmlFor="meeting-egm">EGM</label>
            <textarea
              id="meeting-egm"
              value={meetings.gm?.egm?.notes ?? ""}
              onChange={(event) => updateNotes(["gm", "egm"], event.target.value)}
            />
          </div>
          <div className="detail-field full-width">
            <label htmlFor="meeting-agm">AGM</label>
            <textarea
              id="meeting-agm"
              value={meetings.gm?.agm?.notes ?? ""}
              onChange={(event) => updateNotes(["gm", "agm"], event.target.value)}
            />
          </div>
          <div className="detail-field full-width">
            <label htmlFor="meeting-misc">Miscellaneous</label>
            <textarea
              id="meeting-misc"
              value={meetings.misc?.notes ?? ""}
              onChange={(event) =>
                updateMeetings((current) => ({
                  ...current,
                  misc: {
                    ...(current.misc ?? {}),
                    notes: event.target.value,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingsDetails;
