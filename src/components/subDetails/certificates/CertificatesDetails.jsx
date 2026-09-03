import CertificatesForm from "./CertificatesForm";

function CertificatesDetails({ company, updateCompanies }) {
  return (
    <div className="company-details">
      <div className="company-details-header">
        <div>
          <div className="company-details-label">COMPANY</div>

          <h2>{company.name}</h2>

          <p>Certificates</p>
        </div>
      </div>

      <CertificatesForm company={company} updateCompanies={updateCompanies} />
    </div>
  );
}

export default CertificatesDetails;
