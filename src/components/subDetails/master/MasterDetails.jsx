import MasterDataForm from "./MasterForm";

function MasterDetails({ company, updateCompanies }) {
  return (
    <div className="company-details">
      <div className="company-details-header">
        <div>
          <div className="company-details-label">COMPANY</div>

          <h2>{company.name}</h2>

          <p>{company.division === "umpp" ? "UMPP" : "ITP"}</p>
        </div>
      </div>

      <MasterDataForm company={company} updateCompanies={updateCompanies} />
    </div>
  );
}

export default MasterDetails;
