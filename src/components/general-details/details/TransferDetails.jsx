import FileField from "../components/FileField";
import { updateCompany } from "../../../utils/companyUpdates";
import "./transferDetails.css";

const TRANSFER_SECTIONS = [
  ["docs", "Documents"],
  ["projectDetails", "Project Details"],
  ["transfereeDetails", "Transferee Details"],
  ["transfererDetails", "Transferor Details"],
  ["misc", "Miscellaneous"],
];

function TransferDetails({ company, updateCompanies, onOpenFile }) {
  const transfer = company.transfer ?? {};

  function updateTransferField(field, value) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      transfer: {
        ...(current.transfer ?? {}),
        [field]: {
          ...(current.transfer?.[field] ?? {}),
          files: value,
        },
      },
    }));
  }

  return (
    <div className="detail-page transfer-details">
      <div className="detail-header">
        <div className="detail-eyebrow">TRANSFER</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">Transfer documentation and project details</p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Transfer Record</h3>
        <div className="detail-form-grid">
          {TRANSFER_SECTIONS.map(([field, label]) => (
            <div className="detail-field full-width" key={field}>
              <FileField
                label={label}
                value={transfer[field]?.files ?? []}
                onChange={(value) => updateTransferField(field, value)}
                onOpenFile={onOpenFile}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TransferDetails;
