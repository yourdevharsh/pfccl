import { updateCompany } from "../../../utils/companyUpdates";
import "./filingsDetails.css";

function FilingsDetails({ company, updateCompanies }) {
  const filings = company.filings ?? {};

  function updateFilings(updater) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      filings: updater(current.filings ?? {}),
    }));
  }

  function updateRoc(field, value) {
    updateFilings((current) => ({
      ...current,
      roc: {
        ...(current.roc ?? {}),
        [field]: {
          ...(current.roc?.[field] ?? {}),
          notes: value,
        },
      },
    }));
  }

  return (
    <div className="detail-page filings-details">
      <div className="detail-header">
        <div className="detail-eyebrow">FILINGS</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">ROC and statutory filing records</p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">ROC Filings</h3>
        <div className="detail-form-grid">
          <div className="detail-field full-width">
            <label htmlFor="filings-incorporation">Incorporation</label>
            <textarea
              id="filings-incorporation"
              value={filings.roc?.incorporation?.notes ?? ""}
              onChange={(event) => updateRoc("incorporation", event.target.value)}
            />
          </div>
          <div className="detail-field full-width">
            <label htmlFor="filings-annual">Annual Filings</label>
            <textarea
              id="filings-annual"
              value={filings.roc?.annualFilings?.notes ?? ""}
              onChange={(event) => updateRoc("annualFilings", event.target.value)}
            />
          </div>
          <div className="detail-field full-width">
            <label htmlFor="filings-misc">Miscellaneous</label>
            <textarea
              id="filings-misc"
              value={filings.misc?.notes ?? ""}
              onChange={(event) =>
                updateFilings((current) => ({
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

export default FilingsDetails;
