import FileField from "../components/FileField";
import { updateCompany } from "../../../utils/companyUpdates";
import "./certificatesDetails.css";

const CERTIFICATE_FIELDS = [
  ["coi", "COI"],
  ["moa", "MOA"],
  ["aoa", "AOA"],
  ["gst", "GST"],
  ["espf", "ESPF"],
];

function CertificatesDetails({ company, updateCompanies }) {
  const certificates = company.certificates ?? {};

  function updateCertificate(field, value) {
    updateCompany(updateCompanies, company.id, (current) => ({
      ...current,
      certificates: {
        ...(current.certificates ?? {}),
        [field]: value,
      },
    }));
  }

  return (
    <div className="detail-page certificates-details">
      <div className="detail-header">
        <div className="detail-eyebrow">CERTIFICATES</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">Certificate documents and uploaded files</p>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Certificate Files</h3>
        <div className="certificate-grid">
          {CERTIFICATE_FIELDS.map(([field, label]) => (
            <FileField
              key={field}
              label={label}
              value={certificates[field] ?? null}
              onChange={(value) => updateCertificate(field, value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CertificatesDetails;
