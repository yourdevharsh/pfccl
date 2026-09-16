import "./divisionDetails.css";

function DivisionDetails({ division, companies, onSelect }) {
  const divisionCompanies = companies.filter((company) => company.division === division);
  const divisionName = division === "umpp" ? "UMPP" : "ITP";

  return (
    <div className="detail-page division-details">
      <div className="detail-header">
        <div className="detail-eyebrow">DIVISION</div>
        <h2 className="detail-title">{divisionName}</h2>
        <p className="detail-subtitle">Division-level summary and company list</p>
      </div>

      <div className="detail-card">
        <div className="division-summary">
          <span>Companies in division</span>
          <strong>{divisionCompanies.length}</strong>
        </div>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Companies</h3>

        {divisionCompanies.length === 0 ? (
          <p className="division-empty">No companies have been added to this division.</p>
        ) : (
          <div className="division-company-list">
            {divisionCompanies.map((company) => (
              <button
                type="button"
                className="division-company-row"
                key={company.id}
                onClick={() => onSelect(company.id)}
              >
                <span>
                  <strong>{company.name}</strong>
                  <small>{company.id}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DivisionDetails;
