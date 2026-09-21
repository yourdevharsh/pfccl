import { useCallback, useEffect, useState } from "react";
import CompanyTree from "./components/company-tree/CompanyTree";
import DetailsWorkspace from "./components/details-workspace/DetailsWorkspace";
import BoardEventsSidebar from "./components/board-events/BoardEventsSidebar";
import AIAssistant from "./components/ai/AIAssistant";
import { getCurrentYear } from "./config/treeConfig";
import { useRepositoryData } from "./hooks";
import "./App.css";

function App() {
  const [selectedNodeId, updateSelectedNodeId] = useState("pfccl");
  const [selectedYearByDivision, updateSelectedYearByDivision] = useState({});
  const [selectedStatusByDivision, updateSelectedStatusByDivision] = useState({});
  const [meetingFocus, setMeetingFocus] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSelecting, setAiSelecting] = useState(false);
  const [aiSelections, setAiSelections] = useState([]);

  const repository = useRepositoryData({
    selectedNodeId,
    selectedYearByDivision,
    selectedStatusByDivision,
  });
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
    updateSelectedStatusByDivision((current) => {
      const next = { ...current };
      repository.divisions.forEach((division) => {
        if (!next[division.id]) next[division.id] = "ALL";
      });
      return next;
    });
  }, [repository.divisions]);

  const handleSelectNode = useCallback((nodeId) => {
    updateSelectedNodeId(nodeId);
    if (!nodeId.endsWith?.("-meetings")) setMeetingFocus(null);
  }, []);

  const handleYearChange = useCallback((division, year) => {
    updateSelectedYearByDivision((current) => ({ ...current, [division]: year === "all" ? "all" : Number(year) }));
    updateSelectedNodeId((currentNodeId) => {
      const company = companies.find((item) => item.id === currentNodeId || currentNodeId.startsWith(`${item.id}-`));
      return company?.division === division ? division : currentNodeId;
    });
  }, [companies]);

  const handleStatusChange = useCallback((division, status) => {
    updateSelectedStatusByDivision((current) => ({ ...current, [division]: status }));
    updateSelectedNodeId((currentNodeId) => {
      const company = companies.find((item) => item.id === currentNodeId || currentNodeId.startsWith(`${item.id}-`));
      return company?.division === division && status !== "ALL" && String(company.status || "ACTIVE").toUpperCase() !== status
        ? division
        : currentNodeId;
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

  const openMeetingEvent = useCallback((event) => {
    updateSelectedNodeId(`${event.companyId}-meetings`);
    setMeetingFocus({ companyId: event.companyId, meetingId: event.meetingId || null });
  }, []);

  const openCompanyMeeting = useCallback((companyId) => {
    updateSelectedNodeId(`${companyId}-meetings`);
    setMeetingFocus({ companyId, meetingId: null });
  }, []);

  const handleAiSelect = useCallback((item) => {
    if (!item) return;
    setAiSelections((current) => current.some((existing) => existing.id === item.id) ? current : [...current, item]);
  }, []);

  const removeAiSelection = useCallback((selectionId) => {
    setAiSelections((current) => current.filter((item) => item.id !== selectionId));
  }, []);

  const handleAiClose = useCallback(() => {
    setAiOpen(false);
    setAiSelecting(false);
  }, []);

  return (
    <div className={`app ${aiOpen ? "ai-open" : ""}`}>
      <header className="app-header">
        <div className="brand"><div className="brand-mark" aria-hidden="true">PFCCL</div><div><div className="brand-name">PFCCL</div><div className="brand-subtitle">Subsidiaries Repo</div></div></div>
        {repository.error && <div className="app-error">{repository.error}</div>}
      </header>

      <BoardEventsSidebar events={repository.meetingEvents?.events || []} onOpenEvent={openMeetingEvent} />

      <main className="app-main">
        <div className={`app-main-content ${aiOpen ? "app-main-ai-open" : ""}`}>
          <section className="tree-section" aria-label="Application tree">
            <CompanyTree
              companies={companies}
              selectedNodeId={selectedNodeId}
              onSelect={handleSelectNode}
              selectedYearByDivision={selectedYearByDivision}
              selectedStatusByDivision={selectedStatusByDivision}
              onYearChange={handleYearChange}
              onStatusChange={handleStatusChange}
              onAddCompany={addCompany}
              onDeleteCompany={deleteCompany}
              divisions={repository.divisions}
              root={repository.root}
              loading={repository.loading}
            />
          </section>
          <section className="details-section" aria-label="General details and documents">
            <DetailsWorkspace
              selectedNodeId={selectedNodeId}
              companies={companies}
              selectedYearByDivision={selectedYearByDivision}
              updateCompanies={repository.updateCompany}
              onSelect={handleSelectNode}
              onUploadFiles={repository.uploadFiles}
              onDeleteFile={repository.deleteFile}
              loadingDetail={repository.loadingDetail}
              root={repository.root}
              meetingFocus={meetingFocus}
              meetingsByCompany={repository.meetingsByCompany}
              meetingDashboard={repository.meetingDashboard}
              onCreateMeeting={repository.createMeeting}
              onUpdateMeeting={repository.updateMeeting}
              onDeleteMeeting={repository.deleteMeeting}
              onRecordEarlyBoardMeeting={repository.recordEarlyBoardMeeting}
              onOpenCompanyMeeting={openCompanyMeeting}
              aiSelecting={aiSelecting}
              onAiSelect={handleAiSelect}
              onAiRemoveSelection={removeAiSelection}
            />
          </section>
        </div>
        <AIAssistant open={aiOpen} onOpen={() => setAiOpen(true)} onClose={handleAiClose} selecting={aiSelecting} onToggleSelect={() => setAiSelecting((current) => !current)} selections={aiSelections} onRemoveSelection={removeAiSelection} />
      </main>
    </div>
  );
}
export default App;
