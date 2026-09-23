import FileField from "../../documents/FileField";
import { TextAreaField } from "../../ui/FormField";
import "./miscDetails.css";

export default function MiscDetails({ company, updateCompanies, onOpenFile, onUploadFiles, onDeleteFile }) {
  return (
    <div className="detail-page misc-details" data-ai-company-id={company.id} data-ai-detail-key="miscellaneous" data-ai-section="true" data-ai-section-name="Miscellaneous">
      <div className="detail-header"><div className="detail-eyebrow">MISCELLANEOUS</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Additional notes and supporting records.</p></div>
      <div className="detail-card">
        <TextAreaField label="General notes" value={company.misc?.notes ?? ""} onChange={(event) => updateCompanies(company.id, (current) => ({ ...current, misc: { ...(current.misc ?? {}), notes: event.target.value } }))} aiField={{ name: "General notes", companyId: company.id, detailKey: "miscellaneous", path: "notes" }} />
      </div>
      <div className="detail-card">
        <FileField label="Miscellaneous documents" field="documents" detailKey="miscellaneous" companyId={company.id} value={company.misc?.documents?.files ?? []} onUpload={onUploadFiles} onDeleteFile={onDeleteFile} onOpenFile={onOpenFile} />
      </div>
    </div>
  );
}
