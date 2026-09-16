import FileField from "../components/FileField";
import "./certificatesDetails.css";

const CERTIFICATE_FIELDS = [
  ["coi", "COI"], ["moa", "MOA"], ["aoa", "AOA"], ["gst", "GST"], ["espf", "ESPF"],
];

function CertificatesDetails({ company, onOpenFile, onUploadFiles, onDeleteFile }) {
  const certificates = company.certificates ?? {};
  return (
    <div className="detail-page certificates-details">
      <div className="detail-header"><div className="detail-eyebrow">CERTIFICATES</div><h2 className="detail-title">{company.name}</h2><p className="detail-subtitle">Certificate documents and uploaded files</p></div>
      <div className="detail-card"><h3 className="detail-card-title">Certificate Files</h3><div className="certificate-grid">
        {CERTIFICATE_FIELDS.map(([field, label]) => (
          <FileField key={field} label={label} field={field} detailKey="certificates" companyId={company.id} value={certificates[field] ?? []} onUpload={onUploadFiles} onDeleteFile={onDeleteFile} onOpenFile={onOpenFile} />
        ))}
      </div></div>
    </div>
  );
}
export default CertificatesDetails;
