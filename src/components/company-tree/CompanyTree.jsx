import { useEffect, useRef, useState } from "react";
import TreeNode from "./TreeNode";
import {
  COMPANY_SUB_DETAILS,
  DIVISIONS,
  ROOT_NODE,
  getCompanyYears,
  getCurrentYear,
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
  onAddCompany,
  onDeleteCompany,
}) {
  const years = getCompanyYears();
  const currentYear = getCurrentYear();
  const [collapsed, updateCollapsed] = useState({});
  const [selectedYearByDivision, updateSelectedYearByDivision] = useState({
    umpp: currentYear,
    itp: currentYear,
  });
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
    updateSelectedYearByDivision((current) => ({
      ...current,
      [division]: Number(value),
    }));
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
    updateSelectedYearByDivision((current) => ({
      ...current,
      [division]: currentYear,
    }));
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

        <span className="company-incorporation-year">
          {getIncorporationYear(company)}
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
        <div className="root-row">
          <TreeNode
            type="root"
            name={ROOT_NODE.name}
            selected={selectedNodeId === ROOT_NODE.id}
            collapsed={Boolean(collapsed[ROOT_NODE.id])}
            hasToggle
            onToggle={() => toggleNode(ROOT_NODE.id)}
            onSelect={() => onSelect(ROOT_NODE.id)}
          />
        </div>

        {!collapsed[ROOT_NODE.id] && (
          <>
            <div className="root-drop" />
            <div className="division-stage">
              <div className="root-horizontal" />

              <div className="division-row">
                {DIVISIONS.map((division) => {
                  const selectedYear =
                    selectedYearByDivision[division.id] ?? currentYear;
                  const divisionCompanies = companies.filter(
                    (company) =>
                      company.division === division.id &&
                      getIncorporationYear(company) === selectedYear,
                  );
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
                              {years.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>

                          {divisionCompanies.length === 0 ? (
                            <div className="empty-company-state">
                              No companies incorporated in {selectedYear}
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
