import FileField from "../components/FileField";
import "./transferDetails.css";

const TRANSFER_SECTIONS = [["docs", "Documents"], ["projectDetails", "Project Details"], ["transfereeDetails", "Transferee Details"], ["transfererDetails", "Transferor Details"], ["misc", "Miscellaneous"]];

function TransferDetails({ company, onOpenFile, onUploadFiles, onDeleteFile }) {
  const transfer = company.transfer ?? {};
  return (
    <div className="detail-page transfer-details">
      <div className="detail-header"><div className="detail-eyebrow">TRANSFER</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Transfer documentation and project details</p></div>
      <div className="detail-card"><h3 className="detail-card-title">Transfer Record</h3><div className="detail-form-grid">
        {TRANSFER_SECTIONS.map(([field, label]) => <div className="detail-field full-width" key={field}><FileField label={label} field={field} detailKey="transfer" companyId={company.id} value={transfer[field]?.files ?? []} onUpload={onUploadFiles} onDeleteFile={onDeleteFile} onOpenFile={onOpenFile} /></div>)}
      </div></div>
    </div>
  );
}
export default TransferDetails;
