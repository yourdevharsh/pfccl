import BoardMeetingOverview from "../04-company-sections/07-board-meeting-overview/BoardMeetingOverview";
import "./pfcclDetails.css";

function PfcclDetails({
  companies,
  onSelect,
  onOpenCompanyMeeting,
  root,
  meetingDashboard,
  onRecordEarlyBoardMeeting,
}) {
  const umppCount = companies.filter(
    (company) => company.division === "umpp",
  ).length;
  const itpCount = companies.filter(
    (company) => company.division === "itp",
  ).length;
  const total =
    root?.totalCompanies ??
    root?.stats?.totalCompanies ??
    meetingDashboard?.companies?.length ??
    companies.length;
  const umppTotal =
    root?.umppCompanies ?? root?.stats?.umppCompanies ?? umppCount;
  const itpTotal = root?.itpCompanies ?? root?.stats?.itpCompanies ?? itpCount;

  return (
    <div className="detail-page pfccl-details">
      <div className="detail-header">
        <div className="detail-eyebrow">ROOT</div>
        <h2 className="detail-title">PFCCL</h2>
        <p className="detail-subtitle">
          Parent organization overview and meeting control centre
        </p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Repository Overview</h3>
        <div className="detail-stat-grid">
          <div className="detail-stat">
            <span className="detail-stat-label">Total companies</span>
            <span className="detail-stat-value">{total}</span>
          </div>
          <button
            type="button"
            className="pfccl-stat-button"
            onClick={() => onSelect("umpp")}
          >
            <span className="detail-stat-label">UMPP companies</span>
            <span className="detail-stat-value">{umppTotal}</span>
          </button>
          <button
            type="button"
            className="pfccl-stat-button"
            onClick={() => onSelect("itp")}
          >
            <span className="detail-stat-label">ITP companies</span>
            <span className="detail-stat-value">{itpTotal}</span>
          </button>
        </div>
      </div>

      <BoardMeetingOverview
        rows={meetingDashboard?.companies || []}
        onRecordEarly={onRecordEarlyBoardMeeting}
        onOpenMeeting={onOpenCompanyMeeting}
      />
    </div>
  );
}

export default PfcclDetails;
