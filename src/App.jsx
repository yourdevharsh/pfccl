import { useState } from "react";
import CompanyTree from "./components/company-tree/CompanyTree";
import DetailsWorkspace from "./components/details-workspace/DetailsWorkspace";
import { getCurrentYear, getNextCompanyId } from "./config/treeConfig";
import { createCompanyRecord, initialCompanies } from "./data/initialData";
import "./App.css";

function App() {
  const [companies, updateCompanies] = useState(initialCompanies);
  const [selectedNodeId, updateSelectedNodeId] = useState("pfccl");

  function addCompany(division) {
    const id = getNextCompanyId(companies, division);
    const companyNumber = Number(id.split("-")[1]);
    const newCompany = createCompanyRecord({
      id,
      name: `New Company ${companyNumber}`,
      division,
      incorporationDate: `${getCurrentYear()}-01-01`,
    });

    updateCompanies((current) => [...current, newCompany]);
    updateSelectedNodeId(newCompany.id);
  }

  function deleteCompany(companyId) {
    const company = companies.find((item) => item.id === companyId);
    if (!company) return;

    const confirmed = window.confirm(`Delete "${company.name}"?`);
    if (!confirmed) return;

    updateCompanies((current) =>
      current.filter((item) => item.id !== companyId),
    );

    if (
      selectedNodeId === companyId ||
      selectedNodeId.startsWith(`${companyId}-`)
    ) {
      updateSelectedNodeId(company.division);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            PF
          </div>

          <div>
            <div className="brand-name">PFCCL</div>
            <div className="brand-subtitle">Subsidiaries Repo</div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="tree-section" aria-label="Application tree">
          <CompanyTree
            companies={companies}
            selectedNodeId={selectedNodeId}
            onSelect={updateSelectedNodeId}
            onAddCompany={addCompany}
            onDeleteCompany={deleteCompany}
          />
        </section>

        <section className="details-section" aria-label="General details and documents">
          <DetailsWorkspace
            selectedNodeId={selectedNodeId}
            companies={companies}
            updateCompanies={updateCompanies}
            onSelect={updateSelectedNodeId}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
