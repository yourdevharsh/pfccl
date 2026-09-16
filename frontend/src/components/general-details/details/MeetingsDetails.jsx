import FileField from "../components/FileField";
import "./meetingsDetails.css";

function MeetingsDetails({ company, updateCompanies, onOpenFile, onUploadFiles, onDeleteFile }) {
  const meetings = company.meetings ?? {};
  function updateMeetings(updater) {
    updateCompanies(company.id, (current) => ({ ...current, meetings: updater(current.meetings ?? {}) }));
  }
  const fileProps = (field, value) => ({ companyId: company.id, detailKey: "meetings", field, value, onUpload: onUploadFiles, onDeleteFile, onOpenFile });
  return (
    <div className="detail-page meetings-details">
      <div className="detail-header"><div className="detail-eyebrow">MEETINGS</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Board and general meeting records</p></div>
      <div className="detail-card"><h3 className="detail-card-title">Board Meetings</h3><div className="detail-form-grid">
        <div className="detail-field"><label htmlFor={`meeting-count-${company.id}`}>Number of Meetings</label><input id={`meeting-count-${company.id}`} type="number" min="0" value={meetings.bm?.numberOfMeetings ?? 0} onChange={(event) => updateMeetings((current) => ({ ...current, bm: { ...(current.bm ?? {}), numberOfMeetings: Number(event.target.value) } }))} /></div>
        <div className="detail-field full-width"><FileField label="Minutes / Notes" {...fileProps("bm.minutes", meetings.bm?.minutes?.files ?? [])} /></div>
      </div></div>
      <div className="detail-card"><h3 className="detail-card-title">General Meetings</h3><div className="detail-form-grid">
        <div className="detail-field full-width"><FileField label="EGM" {...fileProps("gm.egm", meetings.gm?.egm?.files ?? [])} /></div>
        <div className="detail-field full-width"><FileField label="AGM" {...fileProps("gm.agm", meetings.gm?.agm?.files ?? [])} /></div>
        <div className="detail-field full-width"><FileField label="Miscellaneous" {...fileProps("misc", meetings.misc?.files ?? [])} /></div>
      </div></div>
    </div>
  );
}
export default MeetingsDetails;
