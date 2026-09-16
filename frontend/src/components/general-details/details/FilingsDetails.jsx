import FileField from "../components/FileField";
import "./filingsDetails.css";

const FILING_FIELDS = [
  ["roc.incorporation", "Incorporation"],
  ["roc.annualFilings", "Annual Filings"],
  ["misc", "Miscellaneous"],
];

function readFiles(filings, path) {
  if (path === "misc") return filings.misc?.files ?? [];
  const [section, field] = path.split(".");
  return filings[section]?.[field]?.files ?? [];
}

function FilingsDetails({ company, onOpenFile, onUploadFiles, onDeleteFile }) {
  const filings = company.filings ?? {};
  return (
    <div className="detail-page filings-details">
      <div className="detail-header"><div className="detail-eyebrow">FILINGS</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">ROC and statutory filing records</p></div>
      <div className="detail-card"><h3 className="detail-card-title">Filing Documents</h3><div className="detail-form-grid">
        {FILING_FIELDS.map(([field, label]) => (
          <div className="detail-field full-width" key={field}>
            <FileField label={label} field={field} detailKey="filings" companyId={company.id} value={readFiles(filings, field)} onUpload={onUploadFiles} onDeleteFile={onDeleteFile} onOpenFile={onOpenFile} />
          </div>
        ))}
      </div></div>
    </div>
  );
}
export default FilingsDetails;
