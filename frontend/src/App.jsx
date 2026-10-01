import { useCallback, useEffect, useState } from "react";
import CompanyTree from "./01-app-shell/02-company-tree/CompanyTree";
import DetailsWorkspace from "./01-app-shell/03-details-workspace/DetailsWorkspace";
import BoardEventsSidebar from "./01-app-shell/01-board-events/BoardEventsSidebar";
import AIAssistant from "./01-app-shell/04-ai-assistant/AIAssistant";
import { getCurrentYear } from "./06-config/treeConfig";
import { useRepositoryData } from "./04-hooks/hooks";
import "./App.css";

function App() {
  const [selectedNodeId, updateSelectedNodeId] = useState("pfccl");
  const [selectedYearByDivision, updateSelectedYearByDivision] = useState({});
  const [selectedStatusByDivision, updateSelectedStatusByDivision] = useState(
    {},
  );
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

  const revealCompanyContext = useCallback(
    (companyId, fallbackDivision) => {
      const company = companies.find((item) => item.id === companyId);
      const meetingRow = (repository.meetingDashboard?.companies || []).find(
        (row) => row.companyId === companyId,
      );
      const division =
        company?.division || meetingRow?.division || fallbackDivision;
      if (division) {
        const incorporationYear = Number.parseInt(
          String(
            company?.incorporationDate || meetingRow?.incorporationDate || "",
          ).slice(0, 4),
          10,
        );
        if (Number.isInteger(incorporationYear))
          updateSelectedYearByDivision((current) => ({
            ...current,
            [division]: incorporationYear,
          }));
        const status = String(
          company?.status || meetingRow?.status || "ACTIVE",
        ).toUpperCase();
        updateSelectedStatusByDivision((current) => ({
          ...current,
          [division]: status || "ALL",
        }));
      }
      return company;
    },
    [companies, repository.meetingDashboard],
  );

  const handleSelectNode = useCallback(
    (nodeId) => {
      const company = companies.find(
        (item) => item.id === nodeId || nodeId.startsWith(`${item.id}-`),
      );
      if (company) revealCompanyContext(company.id, company.division);
      updateSelectedNodeId(nodeId);
      if (!nodeId.endsWith?.("-meetings")) setMeetingFocus(null);
    },
    [companies, revealCompanyContext],
  );

  const handleYearChange = useCallback(
    (division, year) => {
      const normalizedYear = year === "all" ? "all" : Number(year);
      updateSelectedYearByDivision((current) => ({
        ...current,
        [division]: normalizedYear,
      }));
      updateSelectedNodeId((currentNodeId) => {
        const company = companies.find(
          (item) =>
            item.id === currentNodeId ||
            currentNodeId.startsWith(`${item.id}-`),
        );
        if (!company || company.division !== division) return currentNodeId;
        const companyYear = Number.parseInt(
          String(company.incorporationDate || "").slice(0, 4),
          10,
        );
        return normalizedYear === "all" || companyYear === normalizedYear
          ? currentNodeId
          : division;
      });
    },
    [companies],
  );

  const handleStatusChange = useCallback(
    (division, status) => {
      updateSelectedStatusByDivision((current) => ({
        ...current,
        [division]: status,
      }));
      updateSelectedNodeId((currentNodeId) => {
        const company = companies.find(
          (item) =>
            item.id === currentNodeId ||
            currentNodeId.startsWith(`${item.id}-`),
        );
        if (!company || company.division !== division) return currentNodeId;
        return status === "ALL" ||
          String(company.status || "ACTIVE").toUpperCase() === status
          ? currentNodeId
          : division;
      });
    },
    [companies],
  );

  const addCompany = useCallback(
    async (division) => {
      updateSelectedYearByDivision((current) => ({
        ...current,
        [division]: getCurrentYear(),
      }));
      updateSelectedStatusByDivision((current) => ({
        ...current,
        [division]: "ALL",
      }));
      const company = await repository.addCompany(division);
      if (company?.id) updateSelectedNodeId(company.id);
    },
    [repository.addCompany],
  );

  const deleteCompany = useCallback(
    async (companyId) => {
      const company = companies.find((item) => item.id === companyId);
      if (!company || !window.confirm(`Delete "${company.name}"?`)) return;
      await repository.deleteCompany(companyId);
      if (
        selectedNodeId === companyId ||
        selectedNodeId.startsWith(`${companyId}-`)
      )
        updateSelectedNodeId(company.division);
    },
    [companies, repository.deleteCompany, selectedNodeId],
  );

  const openMeetingEvent = useCallback(
    (event) => {
      revealCompanyContext(event.companyId, event.division);
      updateSelectedNodeId(`${event.companyId}-meetings`);
      setMeetingFocus({
        companyId: event.companyId,
        meetingId: event.meetingId || null,
      });
    },
    [revealCompanyContext],
  );

  const openCompanyMeeting = useCallback(
    (companyId) => {
      revealCompanyContext(companyId);
      updateSelectedNodeId(`${companyId}-meetings`);
      setMeetingFocus({ companyId, meetingId: null });
    },
    [revealCompanyContext],
  );

  const handleAiSelect = useCallback((item) => {
    if (!item) return;
    setAiSelections((current) => {
      const existingIndex = current.findIndex(
        (existing) => existing.id === item.id,
      );
      if (existingIndex < 0) return [...current, item];
      const next = [...current];
      next[existingIndex] = item;
      return next;
    });
  }, []);

  const removeAiSelection = useCallback((selectionId) => {
    setAiSelections((current) =>
      current.filter((item) => item.id !== selectionId),
    );
  }, []);

  const handleAiClose = useCallback(() => {
    setAiOpen(false);
    setAiSelecting(false);
  }, []);

  return (
    <div className={`app ${aiOpen ? "ai-open" : ""}`}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            PFCCL
          </div>
          <div>
            <div className="brand-name">PFCCL</div>
            <div className="brand-subtitle">Subsidiaries Repo</div>
          </div>
        </div>
        {repository.error && (
          <div className="app-error">{repository.error}</div>
        )}
      </header>

      <BoardEventsSidebar
        events={repository.meetingEvents?.events || []}
        onOpenEvent={openMeetingEvent}
      />

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
          <section
            className="details-section"
            aria-label="General details and documents"
          >
            <DetailsWorkspace
              selectedNodeId={selectedNodeId}
              companies={companies}
              selectedYearByDivision={selectedYearByDivision}
              selectedStatusByDivision={selectedStatusByDivision}
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
              aiSelections={aiSelections}
              onAiSelect={handleAiSelect}
              onAiRemoveSelection={removeAiSelection}
            />
          </section>
        </div>
        <AIAssistant
          open={aiOpen}
          onOpen={() => setAiOpen(true)}
          onClose={handleAiClose}
          selecting={aiSelecting}
          onToggleSelect={() => setAiSelecting((current) => !current)}
          selections={aiSelections}
          onRemoveSelection={removeAiSelection}
        />
      </main>
    </div>
  );
}
export default App;
