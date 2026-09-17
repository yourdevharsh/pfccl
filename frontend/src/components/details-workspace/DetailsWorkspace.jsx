import { useEffect, useRef, useState } from "react";
import GeneralDetails from "../general-details/GeneralDetails";
import DetailsNavigation from "./DetailsNavigation";
import PDFPane from "./PDFPane";
import { getFileKey } from "../../utils/fileUtils";
import { getAiSelectionFromTarget } from "../../utils/aiSelection";
import "./detailsWorkspace.css";

function DetailsWorkspace({
  selectedNodeId,
  companies,
  updateCompanies,
  selectedYearByDivision,
  onSelect,
  onUploadFiles,
  onDeleteFile,
  loadingDetail,
  root,
  aiSelecting = false,
  aiSelections = [],
  onAiSelect,
  onAiRemoveSelection,
}) {
  const usageRef = useRef(0);
  const [panels, setPanels] = useState([
    {
      id: "main",
      type: "main",
      minimized: false,
      closed: false,
      lastUsed: 0,
    },
  ]);
  const lastClickRef = useRef({ time: 0, target: null });

  function handleWorkspaceClickCapture(event) {
    if (!aiSelecting) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest(".details-main-header, .details-main-actions, .details-navigation, .workspace-icon-button, .details-main-rail, .details-reopen-button")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const now = Date.now();
    const interactionTarget = target.closest("button, label, input, textarea, select, .file-entry, .detail-field, .detail-card, .detail-page, .pdf-pane") || target;
    const previous = lastClickRef.current;
    const isDoubleLike = previous.target === interactionTarget && now - previous.time < 500;

    if (isDoubleLike) {
      // The first click was intentionally blocked for selection. On the second
      // click we remove only the selection that the first click just created,
      // then allow the native interaction to happen (edit/open/navigation).
      if (previous.selectionId && !previous.wasAlreadySelected) {
        onAiRemoveSelection?.(previous.selectionId);
      }

      lastClickRef.current = { time: 0, target: null, selectionId: null, wasAlreadySelected: false };

      // Never allow a delete action while selection mode is active.
      if (target.closest(".file-icon-button.danger")) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    const selection = getAiSelectionFromTarget(target);
    const wasAlreadySelected = Boolean(selection && aiSelections.some((item) => item.id === selection.id));
    lastClickRef.current = {
      time: now,
      target: interactionTarget,
      selectionId: selection?.id || null,
      wasAlreadySelected,
    };

    if (selection) {
      onAiSelect?.(selection);
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function handleWorkspaceDoubleClickCapture(event) {
    // Double-click behavior is handled by the second click in
    // handleWorkspaceClickCapture so browser-native editing/opening can run.
    if (!aiSelecting) return;
    if (event.target instanceof Element && event.target.closest(".file-icon-button.danger")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  useEffect(() => {
    const usage = ++usageRef.current;
    setPanels((current) =>
      current.map((panel) =>
        panel.id === "main" && !panel.closed && !panel.minimized
          ? { ...panel, lastUsed: usage }
          : panel,
      ),
    );
  }, [selectedNodeId]);

  function minimizeOldestExpanded(nextPanels, exceptId) {
    const expandedPanels = nextPanels.filter(
      (panel) => !panel.closed && !panel.minimized && panel.id !== exceptId,
    );

    if (!expandedPanels.length) return nextPanels;

    const oldest = [...expandedPanels].sort(
      (a, b) => a.lastUsed - b.lastUsed,
    )[0];

    return nextPanels.map((panel) =>
      panel.id === oldest.id ? { ...panel, minimized: true } : panel,
    );
  }

  function expandPanel(panelId, { mainWasUsed = false } = {}) {
    const mainUsage = mainWasUsed ? ++usageRef.current : null;
    const targetUsage = ++usageRef.current;

    setPanels((current) => {
      let next = current.map((panel) => {
        if (
          panel.id === "main" &&
          mainUsage !== null &&
          !panel.closed &&
          !panel.minimized
        ) {
          return { ...panel, lastUsed: mainUsage };
        }
        if (panel.id === panelId) {
          return {
            ...panel,
            minimized: false,
            closed: false,
            lastUsed: targetUsage,
          };
        }
        return panel;
      });

      const target = next.find((panel) => panel.id === panelId);
      const expanded = next.filter(
        (panel) => !panel.closed && !panel.minimized,
      );

      if (target && !target.minimized && expanded.length > 2) {
        next = minimizeOldestExpanded(next, panelId);
      }

      return next;
    });
  }

  function openPdfFile(file, title) {
    const fileKey = getFileKey(file);
    if (!fileKey) return;

    const interactionUsage = ++usageRef.current;
    const pdfUsage = ++usageRef.current;

    setPanels((current) => {
      const existing = current.find(
        (panel) => panel.type === "pdf" && getFileKey(panel.file) === fileKey,
      );

      let next;

      if (existing) {
        next = current.map((panel) => {
          if (panel.id === "main") {
            return !panel.closed && !panel.minimized
              ? { ...panel, lastUsed: interactionUsage }
              : panel;
          }

          if (panel.id === existing.id) {
            return {
              ...panel,
              minimized: false,
              lastUsed: pdfUsage,
            };
          }

          return panel;
        });
      } else {
        const newPanel = {
          id: `pdf-${pdfUsage}`,
          type: "pdf",
          file,
          title: title || file.name || "PDF",
          minimized: false,
          closed: false,
          lastUsed: pdfUsage,
        };

        const existingPdfPanels = current.filter((panel) => panel.type === "pdf");

        if (existingPdfPanels.length < 2) {
          next = [...current, newPanel];
        } else {
          const oldestPdf = [...existingPdfPanels].sort(
            (a, b) => a.lastUsed - b.lastUsed,
          )[0];

          next = current.map((panel) =>
            panel.id === oldestPdf.id ? newPanel : panel,
          );
        }

        next = next.map((panel) =>
          panel.id === "main" && !panel.closed && !panel.minimized
            ? { ...panel, lastUsed: interactionUsage }
            : panel,
        );
      }

      const expandedCount = next.filter(
        (panel) => !panel.closed && !panel.minimized,
      ).length;

      return expandedCount > 2
        ? minimizeOldestExpanded(next, existing?.id ?? next.find((panel) => panel.lastUsed === pdfUsage)?.id)
        : next;
    });
  }

  function minimizePanel(panelId) {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === panelId ? { ...panel, minimized: true } : panel,
      ),
    );
  }

  function closePanel(panelId) {
    setPanels((current) =>
      current.filter((panel) => panel.id !== panelId),
    );
  }

  function closeMainPanel() {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === "main"
          ? { ...panel, minimized: true, closed: true }
          : panel,
      ),
    );
  }

  const mainPanel = panels.find((panel) => panel.id === "main");
  const pdfPanels = panels.filter((panel) => panel.type === "pdf");

  return (
    <div className={`details-workspace ${aiSelecting ? "ai-selection-mode" : ""}`} onClickCapture={handleWorkspaceClickCapture} onDoubleClickCapture={handleWorkspaceDoubleClickCapture}>
      {mainPanel && !mainPanel.closed && (
        <section
          className={`details-main-pane ${
            mainPanel.minimized
              ? "details-pane-minimized"
              : "details-pane-expanded"
          }`}
        >
          {mainPanel.minimized ? (
            <aside className="details-main-rail" title="General Details">
              <button
                type="button"
                className="workspace-icon-button"
                onClick={() => expandPanel("main")}
                title="Expand General Details"
                aria-label="Expand General Details"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5H5v3m0-3 6 6m5-6h3v3m0-3-6 6M8 19H5v-3m0 3 6-6m5 6h3v-3m0 3-6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="workspace-icon-button danger"
                onClick={closeMainPanel}
                title="Close General Details"
                aria-label="Close General Details"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
              <div className="details-main-rail-label">General Details</div>
            </aside>
          ) : (
            <div className="details-main-content">
              <div className="details-main-header">
                <div className="details-main-header-left">
                  <DetailsNavigation
                    selectedNodeId={selectedNodeId}
                    companies={companies}
                    selectedYearByDivision={selectedYearByDivision}
                    onSelect={onSelect}
                  />
                  <div>
                    <div className="details-main-eyebrow">DETAILS</div>
                    <div className="details-main-title">General Details</div>
                  </div>
                </div>
                <div className="details-main-actions">
                  <button
                    type="button"
                    className="workspace-icon-button"
                    onClick={() => minimizePanel("main")}
                    title="Minimize General Details"
                    aria-label="Minimize General Details"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="workspace-icon-button danger"
                    onClick={closeMainPanel}
                    title="Close General Details"
                    aria-label="Close General Details"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="details-main-scroll">
                <GeneralDetails
                  selectedNodeId={selectedNodeId}
                  companies={companies}
                  updateCompanies={updateCompanies}
                  onSelect={onSelect}
                  onOpenFile={openPdfFile}
                  onUploadFiles={onUploadFiles}
                  onDeleteFile={onDeleteFile}
                  loadingDetail={loadingDetail}
                  root={root}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {pdfPanels.map((panel, index) => (
        <PDFPane
          key={panel.id}
          file={panel.file}
          expanded={!panel.minimized}
          onExpand={() => expandPanel(panel.id, { mainWasUsed: true })}
          onMinimize={() => minimizePanel(panel.id)}
          onClose={() => closePanel(panel.id)}
          paneNumber={`PDF ${index + 1}`}
        />
      ))}

      {mainPanel?.closed && (
        <button
          type="button"
          className="details-reopen-button"
          onClick={() => expandPanel("main")}
        >
          Open General Details
        </button>
      )}

      {pdfPanels.length > 0 && (
        <div className="details-workspace-hint">
          At most two panes stay expanded. Expanding a third pane minimizes the least recently used expanded pane.
        </div>
      )}
    </div>
  );
}

export default DetailsWorkspace;
