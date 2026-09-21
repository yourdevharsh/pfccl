import { useEffect, useRef, useState } from "react";
import TreeNode from "./TreeNode";
import {
  COMPANY_SUB_DETAILS,
  getCompanyYears,
  getCurrentYear,
  COMPANY_STATUS_FILTERS,
  getSubDetailId,
} from "../../config/treeConfig";
import "./companyTree.css";

function getIncorporationYear(company) {
  const year = Number.parseInt(company.incorporationDate?.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function CompanyTree({
  companies,
  selectedNodeId,
  onSelect,
  selectedYearByDivision,
  selectedStatusByDivision,
  onYearChange,
  onStatusChange,
  onAddCompany,
  onDeleteCompany,
  divisions = [],
  root,
  loading = false,
}) {
  const years = getCompanyYears();
  const currentYear = getCurrentYear();
  const rootNode = root;
  const [collapsed, updateCollapsed] = useState({});
  const [hoveredCompany, setHoveredCompany] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const hidePopupTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (hidePopupTimer.current) clearTimeout(hidePopupTimer.current);
    };
  }, []);

  function toggleNode(id) {
    updateCollapsed((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function handleYearChange(division, value) {
    onYearChange?.(division, value === "all" ? "all" : Number(value));
  }

  function handleStatusChange(division, value) {
    onStatusChange?.(division, value);
  }

  function cancelPopupHide() {
    if (hidePopupTimer.current) {
      clearTimeout(hidePopupTimer.current);
      hidePopupTimer.current = null;
    }
  }

  function handleCompanyMouseEnter(company, event) {
    cancelPopupHide();
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredCompany(company);
    setPopupPosition({ top: rect.top, left: rect.right + 8 });
  }

  function handleCompanyMouseLeave() {
    cancelPopupHide();
    hidePopupTimer.current = setTimeout(() => {
      setHoveredCompany(null);
      hidePopupTimer.current = null;
    }, 150);
  }

  function handlePopupMouseEnter() {
    cancelPopupHide();
  }

  function handlePopupMouseLeave() {
    cancelPopupHide();
    setHoveredCompany(null);
  }

  function selectSubDetail(companyId, subDetailKey) {
    cancelPopupHide();
    onSelect(getSubDetailId(companyId, subDetailKey));
  }

  function handleAddCompany(division) {
    onYearChange?.(division, currentYear);
    onAddCompany(division);
  }

  function renderCompany(company) {
    return (
      <li
        key={company.id}
        className={`company-list-item ${
          selectedNodeId === company.id ? "selected" : ""
        }`}
        onMouseEnter={(event) => handleCompanyMouseEnter(company, event)}
        onMouseLeave={handleCompanyMouseLeave}
      >
        <button
          type="button"
          className="company-name"
          onClick={() => onSelect(company.id)}
          aria-current={selectedNodeId === company.id ? "true" : undefined}
        >
          {company.name}
        </button>

        <span className={`company-status-badge status-${String(company.status || "ACTIVE").toLowerCase()}`}>
          {String(company.status || "ACTIVE").replaceAll("_", " ")}
        </span>
        <span className="company-incorporation-year">
          {getIncorporationYear(company) || "—"}
        </span>

        <button
          type="button"
          className="company-list-delete"
          onClick={(event) => {
            event.stopPropagation();
            cancelPopupHide();
            onDeleteCompany(company.id);
          }}
          title="Delete company"
          aria-label={`Delete ${company.name}`}
        >
          ×
        </button>
      </li>
    );
  }

  return (
    <div className="tree-wrapper">
      <div className="org-tree">
        {!rootNode ? (
          <div className="tree-loading">Loading repository…</div>
        ) : (
        <>
        <div className="root-row">
          <TreeNode
            type="root"
            name={rootNode.name}
            selected={selectedNodeId === rootNode.id}
            collapsed={Boolean(collapsed[rootNode.id])}
            hasToggle
            onToggle={() => toggleNode(rootNode.id)}
            onSelect={() => onSelect(rootNode.id)}
          />
        </div>

        {!collapsed[rootNode.id] && (
          <>
            <div className="root-drop" />
            <div className="division-stage">
              <div className="root-horizontal" />

              <div className="division-row">
                {loading && divisions.length === 0 ? (
                  <div className="tree-loading">Loading divisions…</div>
                ) : divisions.map((division) => {
                  const selectedYear =
                    selectedYearByDivision[division.id] ?? currentYear;
                  const selectedStatus =
                    selectedStatusByDivision?.[division.id] ?? "ALL";
                  const divisionCompanies = companies.filter((company) => {
                    if (company.division !== division.id) return false;
                    if (selectedYear !== "all" && getIncorporationYear(company) !== Number(selectedYear)) return false;
                    if (selectedStatus !== "ALL" && String(company.status || "ACTIVE").toUpperCase() !== selectedStatus) return false;
                    return true;
                  });
                  const divisionCollapsed = Boolean(collapsed[division.id]);

                  return (
                    <div className="division-branch" key={division.id}>
                      <TreeNode
                        type="division"
                        name={division.name}
                        selected={selectedNodeId === division.id}
                        collapsed={divisionCollapsed}
                        hasToggle
                        onToggle={() => toggleNode(division.id)}
                        onSelect={() => onSelect(division.id)}
                        onAdd={() => handleAddCompany(division.id)}
                      />

                      {!divisionCollapsed && (
                        <div className="company-list-wrapper">
                          <div className="company-year-filter">
                            <label htmlFor={`${division.id}-company-year`}>
                              Incorporated in
                            </label>
                            <select
                              id={`${division.id}-company-year`}
                              value={selectedYear}
                              onChange={(event) =>
                                handleYearChange(division.id, event.target.value)
                              }
                            >
                              <option value="all">All years</option>
                              {years.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="company-status-filter">
                            <label htmlFor={`${division.id}-company-status`}>Status</label>
                            <select
                              id={`${division.id}-company-status`}
                              value={selectedStatus}
                              onChange={(event) => handleStatusChange(division.id, event.target.value)}
                            >
                              {COMPANY_STATUS_FILTERS.map((filter) => (
                                <option key={filter.value} value={filter.value}>{filter.label}</option>
                              ))}
                            </select>
                          </div>

                          {divisionCompanies.length === 0 ? (
                            <div className="empty-company-state">
                              No companies match the current year/status filters.
                            </div>
                          ) : (
                            <ul className="company-list">
                              {divisionCompanies.map(renderCompany)}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
        </>
        )}
      </div>

      {hoveredCompany && (
        <div
          className="company-hover-popup"
          style={{ top: popupPosition.top, left: popupPosition.left }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <div className="company-hover-popup-header">
            <h3>{hoveredCompany.name}</h3>
            <span>
              Incorporated {getIncorporationYear(hoveredCompany)}
            </span>
          </div>

          <div className="company-hover-popup-body">
            {COMPANY_SUB_DETAILS.map((subDetail) => {
              const nodeId = getSubDetailId(hoveredCompany.id, subDetail.key);

              return (
                <button
                  type="button"
                  className={`sub-detail-list-item ${
                    selectedNodeId === nodeId ? "selected" : ""
                  }`}
                  key={nodeId}
                  onClick={() =>
                    selectSubDetail(hoveredCompany.id, subDetail.key)
                  }
                >
                  {subDetail.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyTree;
