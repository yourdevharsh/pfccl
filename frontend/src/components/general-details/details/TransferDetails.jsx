import FileField from "../components/FileField";
import StatusPill from "../components/StatusPill";
import { getTransferData, firstPath, formatDate } from "../components/dataHelpers";
import "./transferDetails.css";

const TRANSFER_SECTIONS = [["docs", "Documents"], ["projectDetails", "Project Details"], ["transfereeDetails", "Transferee Details"], ["transfererDetails", "Transferor Details"], ["misc", "Miscellaneous"]];

function TransferDetails({ company, updateCompanies, onOpenFile, onUploadFiles, onDeleteFile }) {
  const transfer = company.transfer ?? {};
  const record = getTransferData(company);
  const status = firstPath(record, ["status", "transferStatus"], "Not recorded");
  const effectiveDate = firstPath(record, ["effectiveDate", "transferDate", "date"], "");
  const project = firstPath(record, ["projectName", "project", "projectDetails.name"], "Not recorded");
  const transferor = firstPath(record, ["transferor", "transferer", "transfererDetails.name", "transferorDetails.name"], "Not recorded");
  const transferee = firstPath(record, ["transferee", "transfereeDetails.name"], "Not recorded");
  const notes = firstPath(record, ["notes", "remarks", "miscellaneous"], "");

  function updateTransferField(field, value) {
    updateCompanies?.(company.id, (current) => ({ ...current, transfer: { ...(current.transfer ?? {}), [field]: value } }));
  }

  return (
    <div className="detail-page transfer-details" data-ai-company-id={company.id} data-ai-detail-key="transfer">
      <div className="detail-header"><div className="detail-eyebrow">TRANSFER</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Lifecycle status and transfer working papers in one view.</p></div>

      <div className="transfer-pulse-grid"><div><span>Status</span><strong><StatusPill value={status} /></strong></div><div><span>Effective date</span><strong>{effectiveDate ? formatDate(effectiveDate) : "Not recorded"}</strong></div><div><span>Project</span><strong>{project}</strong></div></div>

      <div className="detail-card"><h3 className="detail-card-title">Transfer record</h3><div className="detail-form-grid">
        <div className="detail-field"><label htmlFor={`transfer-status-${company.id}`}>Status</label><select id={`transfer-status-${company.id}`} value={transfer.status ?? ""} onChange={(event) => updateTransferField("status", event.target.value)}><option value="">Not recorded</option><option value="Active">Active</option><option value="In process">In process</option><option value="Transferred">Transferred</option><option value="Closed">Closed</option></select></div>
        <div className="detail-field"><label htmlFor={`transfer-date-${company.id}`}>Effective Date</label><input id={`transfer-date-${company.id}`} type="date" value={effectiveDate || ""} onChange={(event) => updateTransferField("transferDate", event.target.value)} /></div>
        <div className="detail-field"><label htmlFor={`transfer-transferor-${company.id}`}>Transferor</label><input id={`transfer-transferor-${company.id}`} value={transfer.transferor ?? transfer.transferer ?? ""} onChange={(event) => updateTransferField("transferor", event.target.value)} /></div>
        <div className="detail-field"><label htmlFor={`transfer-transferee-${company.id}`}>Transferee</label><input id={`transfer-transferee-${company.id}`} value={transfer.transferee ?? ""} onChange={(event) => updateTransferField("transferee", event.target.value)} /></div>
        <div className="detail-field full-width"><label htmlFor={`transfer-project-${company.id}`}>Project / SPV Context</label><input id={`transfer-project-${company.id}`} value={transfer.projectName ?? transfer.project ?? ""} onChange={(event) => updateTransferField("projectName", event.target.value)} /></div>
        <div className="detail-field full-width"><label htmlFor={`transfer-notes-${company.id}`}>Notes</label><textarea id={`transfer-notes-${company.id}`} value={transfer.notes ?? transfer.remarks ?? ""} onChange={(event) => updateTransferField("notes", event.target.value)} /></div>
      </div></div>

      <div className="detail-card transfer-parties"><div><span>Transferor</span><strong>{transferor}</strong></div><div><span>Transferee</span><strong>{transferee}</strong></div><div><span>Context</span><strong>{notes || "No additional notes"}</strong></div></div>

      <div className="detail-card"><h3 className="detail-card-title">Transfer documents</h3><div className="detail-form-grid">{TRANSFER_SECTIONS.map(([field, label]) => <div className="detail-field full-width" key={field}><FileField label={label} field={field} detailKey="transfer" companyId={company.id} value={transfer[field]?.files ?? []} onUpload={onUploadFiles} onDeleteFile={onDeleteFile} onOpenFile={onOpenFile} /></div>)}</div></div>
    </div>
  );
}
export default TransferDetails;
