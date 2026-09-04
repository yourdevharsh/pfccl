import "./pfcclDetails.css";

function PfcclDetails({ companies, onSelect }) {
  const umppCount = companies.filter((company) => company.division === "umpp").length;
  const itpCount = companies.filter((company) => company.division === "itp").length;

  return (
    <div className="detail-page pfccl-details">
      <div className="detail-header">
        <div className="detail-eyebrow">ROOT</div>
        <h2 className="detail-title">PFCCL</h2>
        <p className="detail-subtitle">Parent organization overview</p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Repository Overview</h3>
        <div className="detail-stat-grid">
          <div className="detail-stat">
            <span className="detail-stat-label">Total companies</span>
            <span className="detail-stat-value">{companies.length}</span>
          </div>
          <button type="button" className="pfccl-stat-button" onClick={() => onSelect("umpp")}>
            <span className="detail-stat-label">UMPP companies</span>
            <span className="detail-stat-value">{umppCount}</span>
          </button>
          <button type="button" className="pfccl-stat-button" onClick={() => onSelect("itp")}>
            <span className="detail-stat-label">ITP companies</span>
            <span className="detail-stat-value">{itpCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PfcclDetails;
