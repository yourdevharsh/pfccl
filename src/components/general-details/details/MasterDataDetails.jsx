import { updateCompany } from "../../../utils/companyUpdates";
import "./masterDataDetails.css";

function MasterDataDetails({ company, updateCompanies }) {
  function updateMasterField(field, value) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      master: {
        ...current.master,
        [field]: value,
      },
    }));
  }

  return (
    <div className="detail-page master-data-details">
      <div className="detail-header">
        <div className="detail-eyebrow">MASTER DATA</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">{company.id}-master-data</p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Registered Details</h3>
        <div className="detail-form-grid">
          <div className="detail-field">
            <label htmlFor="master-company-name">Company Name</label>
            <input id="master-company-name" value={company.name} disabled />
          </div>
          <div className="detail-field">
            <label htmlFor="master-division">Division</label>
            <input
              id="master-division"
              value={company.division === "umpp" ? "UMPP" : "ITP"}
              disabled
            />
          </div>
          <div className="detail-field">
            <label htmlFor="master-cin">CIN</label>
            <input
              id="master-cin"
              value={company.master?.cin ?? ""}
              onChange={(event) => updateMasterField("cin", event.target.value)}
            />
          </div>
          <div className="detail-field">
            <label htmlFor="master-pan">PAN</label>
            <input
              id="master-pan"
              value={company.master?.pan ?? ""}
              onChange={(event) => updateMasterField("pan", event.target.value)}
            />
          </div>
          <div className="detail-field">
            <label htmlFor="master-gstin">GSTIN</label>
            <input
              id="master-gstin"
              value={company.master?.gstin ?? ""}
              onChange={(event) => updateMasterField("gstin", event.target.value)}
            />
          </div>
          <div className="detail-field">
            <label htmlFor="master-tan">TAN</label>
            <input
              id="master-tan"
              value={company.master?.tan ?? ""}
              onChange={(event) => updateMasterField("tan", event.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MasterDataDetails;
