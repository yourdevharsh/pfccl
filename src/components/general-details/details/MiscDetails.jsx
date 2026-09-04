import { updateCompany } from "../../../utils/companyUpdates";
import "./miscDetails.css";

function MiscDetails({ company, updateCompanies }) {
  const miscellaneousNotes = company.misc?.notes ?? "";

  function updateNotes(value) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      misc: {
        ...(current.misc ?? {}),
        notes: value,
      },
    }));
  }

  return (
    <div className="detail-page misc-details">
      <div className="detail-header">
        <div className="detail-eyebrow">MISCELLANEOUS</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">Additional notes and information not covered by another module</p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">General Notes</h3>
        <div className="detail-field">
          <label htmlFor="misc-notes">Notes</label>
          <textarea
            id="misc-notes"
            value={miscellaneousNotes}
            onChange={(event) => updateNotes(event.target.value)}
            placeholder="Enter miscellaneous information for this company."
          />
        </div>
      </div>
    </div>
  );
}

export default MiscDetails;
