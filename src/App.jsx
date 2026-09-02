import { useState } from "react";
import CompanyTree from "./components/company-tree/CompanyTree";
import CompanyDetails from "./components/company/CompanyDetails";
import "./App.css";

const initialCompanies = [
  {
    id: "ump-1",
    name: "Company A",
    division: "umpp",
    cin: "",
    pan: "",
    gstin: "",
    tan: "",
  },
  {
    id: "ump-2",
    name: "Company B",
    division: "umpp",
    cin: "",
    pan: "",
    gstin: "",
    tan: "",
  },
  {
    id: "ump-3",
    name: "Company C",
    division: "umpp",
    cin: "",
    pan: "",
    gstin: "",
    tan: "",
  },
  {
    id: "itp-1",
    name: "Company A",
    division: "itp",
    cin: "",
    pan: "",
    gstin: "",
    tan: "",
  },
  {
    id: "itp-2",
    name: "Company B",
    division: "itp",
    cin: "",
    pan: "",
    gstin: "",
    tan: "",
  },
  {
    id: "itp-3",
    name: "Company C",
    division: "itp",
    cin: "",
    pan: "",
    gstin: "",
    tan: "",
  },
];

function App() {
  const [companies, updateCompanies] = useState(initialCompanies);
  const [selectedCompanyId, updateSelectedCompanyId] = useState(null);

  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) || null;

  function addCompany(division) {
    const newCompany = {
      id: crypto.randomUUID(),
      name: "New Company",
      division,
      cin: "",
      pan: "",
      gstin: "",
      tan: "",
    };

    updateCompanies((current) => [...current, newCompany]);
    updateSelectedCompanyId(newCompany.id);
  }

  function deleteCompany(companyId) {
    const company = companies.find((item) => item.id === companyId);

    if (!company) return;

    const confirmed = window.confirm(`Delete "${company.name}"?`);

    if (!confirmed) return;

    updateCompanies((current) => current.filter((item) => item.id !== companyId));

    if (selectedCompanyId === companyId) {
      updateSelectedCompanyId(null);
    }
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">PF</div>

          <div>
            <div className="brand-name">PFCCL</div>

            <div className="brand-subtitle">Subsidiaries Repo</div>
          </div>
        </div>
      </header>

      {/* TREE */}
      <main className="app-main">
        <section className="tree-section">
          <CompanyTree
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelect={updateSelectedCompanyId}
            onAddCompany={addCompany}
            onDeleteCompany={deleteCompany}
          />
        </section>

        {/* DETAILS */}
        <section className="details-section">
          {selectedCompany ? (
            <CompanyDetails
              company={selectedCompany}
              updateCompanies={updateCompanies}
            />
          ) : (
            <div className="details-placeholder">
              <h2>Company Details</h2>
              <p>Select a company from the tree above to view its details.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
