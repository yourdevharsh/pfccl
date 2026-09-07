import FileField from "../components/FileField";
import { updateCompany } from "../../../utils/companyUpdates";
import "./filingsDetails.css";

const FILING_FIELDS = [
  ["roc", "incorporation", "Incorporation"],
  ["roc", "annualFilings", "Annual Filings"],
  ["misc", "files", "Miscellaneous"],
];

function FilingsDetails({ company, updateCompanies, onOpenFile }) {
  const filings = company.filings ?? {};

  function updateFiling(section, field, value) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      filings: {
        ...(current.filings ?? {}),
        [section]:
          field === "files"
            ? value
            : {
                ...(current.filings?.[section] ?? {}),
                files: value,
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
        <h3 className="detail-card-title">Filing Documents</h3>
        <div className="detail-form-grid">
          {FILING_FIELDS.map(([section, field, label]) => (
            <div className="detail-field full-width" key={`${section}-${field}`}>
              <FileField
                label={label}
                value={
                  field === "files"
                    ? filings[section] ?? []
                    : filings[section]?.[field]?.files ?? []
                }
                onChange={(value) => updateFiling(section, field, value)}
                onOpenFile={onOpenFile}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilingsDetails;
