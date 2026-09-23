import FileField from "../../documents/FileField";
import StatusPill from "../../ui/StatusPill";
import { DateField, SelectField, TextAreaField, TextField } from "../../ui/FormField";
import { getTransferData, firstPath, formatDate } from "../../ui/dataHelpers";
import "./transferDetails.css";

const TRANSFER_SECTIONS = [["docs", "Documents"], ["projectDetails", "Project Details"], ["transfereeDetails", "Transferee Details"], ["transfererDetails", "Transferor Details"], ["misc", "Miscellaneous"]];

export default function TransferDetails({ company, updateCompanies, onOpenFile, onUploadFiles, onDeleteFile }) {
  const transfer = company.transfer ?? {};
  const record = getTransferData(company);
  const status = firstPath(record, ["status", "transferStatus"], "Not recorded");
  const effectiveDate = firstPath(record, ["effectiveDate", "transferDate", "date"], "");
  const project = firstPath(record, ["projectName", "project", "projectDetails.name"], "Not recorded");
  const transferor = firstPath(record, ["transferor", "transferer", "transfererDetails.name", "transferorDetails.name"], "Not recorded");
  const transferee = firstPath(record, ["transferee", "transfereeDetails.name"], "Not recorded");
  const notes = firstPath(record, ["notes", "remarks", "miscellaneous"], "");
  function updateTransferField(field, value) { updateCompanies?.(company.id, (current) => ({ ...current, transfer: { ...(current.transfer ?? {}), [field]: value } })); }

  return (
    <div className="detail-page transfer-details" data-ai-company-id={company.id} data-ai-detail-key="transfer" data-ai-section="true" data-ai-section-name="Transfer">
      <div className="detail-header"><div className="detail-eyebrow">TRANSFER</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Lifecycle status, effective date, parties and working papers.</p></div>
      <div className="transfer-pulse-grid"><div><span>Status</span><strong><StatusPill value={status} /></strong></div><div><span>Effective date</span><strong>{effectiveDate ? formatDate(effectiveDate) : "Not recorded"}</strong></div><div><span>Project</span><strong>{project}</strong></div></div>
      <div className="detail-card">
        <h3 className="detail-card-title">Transfer record</h3>
        <div className="detail-form-grid">
          <SelectField label="Status" value={transfer.status ?? ""} onChange={(event) => updateTransferField("status", event.target.value)} options={[{value:"",label:"Not recorded"},{value:"Active",label:"Active"},{value:"In process",label:"In process"},{value:"Transferred",label:"Transferred"},{value:"Closed",label:"Closed"}]} aiField={{ name: "Transfer status", companyId: company.id, detailKey: "transfer", path: "status" }} />
          <DateField label="Effective Date" value={effectiveDate || ""} onChange={(event) => updateTransferField("transferDate", event.target.value)} aiField={{ name: "Transfer effective date", companyId: company.id, detailKey: "transfer", path: "transferDate" }} />
          <TextField label="Transferor" value={transfer.transferor ?? transfer.transferer ?? ""} onChange={(event) => updateTransferField("transferor", event.target.value)} aiField={{ name: "Transferor", companyId: company.id, detailKey: "transfer", path: "transferor" }} />
          <TextField label="Transferee" value={transfer.transferee ?? ""} onChange={(event) => updateTransferField("transferee", event.target.value)} aiField={{ name: "Transferee", companyId: company.id, detailKey: "transfer", path: "transferee" }} />
          <TextField fullWidth label="Project / SPV Context" value={transfer.projectName ?? transfer.project ?? ""} onChange={(event) => updateTransferField("projectName", event.target.value)} aiField={{ name: "Project / SPV Context", companyId: company.id, detailKey: "transfer", path: "projectName" }} />
          <TextAreaField fullWidth label="Notes" value={transfer.notes ?? transfer.remarks ?? ""} onChange={(event) => updateTransferField("notes", event.target.value)} aiField={{ name: "Transfer notes", companyId: company.id, detailKey: "transfer", path: "notes" }} />
        </div>
      </div>
      <div className="detail-card transfer-parties"><div><span>Transferor</span><strong>{transferor}</strong></div><div><span>Transferee</span><strong>{transferee}</strong></div><div><span>Context</span><strong>{notes || "No additional notes"}</strong></div></div>
      <div className="detail-card"><h3 className="detail-card-title">Transfer documents</h3><div className="detail-form-grid">{TRANSFER_SECTIONS.map(([field, label]) => <div className="detail-field full-width" key={field}><FileField label={label} field={field} detailKey="transfer" companyId={company.id} value={transfer[field]?.files ?? []} onUpload={onUploadFiles} onDeleteFile={onDeleteFile} onOpenFile={onOpenFile} /></div>)}</div></div>
    </div>
  );
}
