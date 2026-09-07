import { COMPANY_SUB_DETAILS, getSubDetailId } from "../../../config/treeConfig";
import { updateCompany } from "../../../utils/companyUpdates";
import "./companyDetails.css";

function CompanyDetails({ company, updateCompanies, onSelect }) {
  const divisionName = company.division === "umpp" ? "UMPP" : "ITP";

  function updateCompanyName(value) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      name: value,
    }));
  }

  function updateIncorporationDate(value) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      incorporationDate: value,
    }));
  }

  return (
    <div className="detail-page company-details-page">
      <div className="detail-header">
        <div className="detail-eyebrow">COMPANY</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">
          {divisionName} • {company.id}
        </p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Company Overview</h3>
        <div className="detail-form-grid">
          <div className="detail-field">
            <label htmlFor={`company-name-${company.id}`}>Company Name</label>
            <input
              id={`company-name-${company.id}`}
              value={company.name}
              onChange={(event) => updateCompanyName(event.target.value)}
            />
          </div>
          <div className="detail-field">
            <label htmlFor={`company-division-${company.id}`}>Division</label>
            <input
              id={`company-division-${company.id}`}
              value={divisionName}
              disabled
            />
          </div>
          <div className="detail-field">
            <label htmlFor={`company-id-${company.id}`}>Company ID</label>
            <input id={`company-id-${company.id}`} value={company.id} disabled />
          </div>
          <div className="detail-field">
            <label htmlFor={`company-incorporation-${company.id}`}>
              Incorporation Date
            </label>
            <input
              id={`company-incorporation-${company.id}`}
              type="date"
              value={company.incorporationDate ?? ""}
              onChange={(event) => updateIncorporationDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Company Modules</h3>
        <div className="company-module-grid">
          {COMPANY_SUB_DETAILS.map((module) => (
            <button
              key={module.key}
              type="button"
              className="company-module-card"
              onClick={() => onSelect(getSubDetailId(company.id, module.key))}
            >
              <span>{module.name}</span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompanyDetails;
