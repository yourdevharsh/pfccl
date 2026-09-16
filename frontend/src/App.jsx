import { useCallback, useEffect, useState } from "react";
import CompanyTree from "./components/company-tree/CompanyTree";
import DetailsWorkspace from "./components/details-workspace/DetailsWorkspace";
import { getCurrentYear } from "./config/treeConfig";
import { useRepositoryData } from "./hooks";
import "./App.css";

function App() {
  const [selectedNodeId, updateSelectedNodeId] = useState("pfccl");
  const [selectedYearByDivision, updateSelectedYearByDivision] = useState({});

  const repository = useRepositoryData({ selectedNodeId, selectedYearByDivision });
  const companies = repository.companies;

  useEffect(() => {
    if (!repository.divisions.length) return;
    updateSelectedYearByDivision((current) => {
      const next = { ...current };
      repository.divisions.forEach((division) => {
        if (!next[division.id]) next[division.id] = getCurrentYear();
      });
      return next;
    });
  }, [repository.divisions]);

  const handleYearChange = useCallback((division, year) => {
    updateSelectedYearByDivision((current) => ({ ...current, [division]: Number(year) }));
    updateSelectedNodeId((currentNodeId) => {
      const company = companies.find((item) => item.id === currentNodeId || currentNodeId.startsWith(`${item.id}-`));
      return company?.division === division ? division : currentNodeId;
    });
  }, [companies]);

  const addCompany = useCallback(async (division) => {
    const company = await repository.addCompany(division);
    if (company?.id) updateSelectedNodeId(company.id);
  }, [repository.addCompany]);

  const deleteCompany = useCallback(async (companyId) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company || !window.confirm(`Delete "${company.name}"?`)) return;
    await repository.deleteCompany(companyId);
    if (selectedNodeId === companyId || selectedNodeId.startsWith(`${companyId}-`)) updateSelectedNodeId(company.division);
  }, [companies, repository.deleteCompany, selectedNodeId]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand"><div className="brand-mark" aria-hidden="true">PF</div><div><div className="brand-name">PFCCL</div><div className="brand-subtitle">Subsidiaries Repo</div></div></div>
        {repository.error && <div className="app-error">{repository.error}</div>}
      </header>
      <main className="app-main">
        <section className="tree-section" aria-label="Application tree">
          <CompanyTree companies={companies} selectedNodeId={selectedNodeId} onSelect={updateSelectedNodeId} selectedYearByDivision={selectedYearByDivision} onYearChange={handleYearChange} onAddCompany={addCompany} onDeleteCompany={deleteCompany} divisions={repository.divisions} root={repository.root} loading={repository.loading} />
        </section>
        <section className="details-section" aria-label="General details and documents">
          <DetailsWorkspace selectedNodeId={selectedNodeId} companies={companies} selectedYearByDivision={selectedYearByDivision} updateCompanies={repository.updateCompany} onSelect={updateSelectedNodeId} onUploadFiles={repository.uploadFiles} onDeleteFile={repository.deleteFile} loadingDetail={repository.loadingDetail} root={repository.root} />
        </section>
      </main>
    </div>
  );
}
export default App;
