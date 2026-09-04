import { useEffect, useRef, useState } from "react";
import TreeNode from "./TreeNode";
import {
  COMPANY_SUB_DETAILS,
  DIVISIONS,
  ROOT_NODE,
  getSubDetailId,
} from "../../config/treeConfig";
import "./companyTree.css";

function CompanyTree({
  companies,
  selectedNodeId,
  onSelect,
  onAddCompany,
  onDeleteCompany,
}) {
  const [collapsed, updateCollapsed] = useState({});
  const [hoveredCompany, setHoveredCompany] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const hidePopupTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (hidePopupTimer.current) {
        clearTimeout(hidePopupTimer.current);
      }
    };
  }, []);

  function toggleNode(id) {
    updateCollapsed((current) => ({
      ...current,
      [id]: !current[id],
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
    setPopupPosition({
      top: rect.top,
      left: rect.right + 8,
    });
  }

  function handleCompanyMouseLeave() {
    cancelPopupHide();

    // Keep the popup open briefly so the pointer can move from
    // the company row into the popup without closing it.
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
                  const divisionCompanies = companies.filter(
                    (company) => company.division === division.id,
                  );
                  const divisionCollapsed = Boolean(collapsed[division.id]);

                  return (
                    <div className="division-branch" key={division.id}>
                      <TreeNode
                        type="division"
                        name={division.name}
                        selected={selectedNodeId === division.id}
                        collapsed={divisionCollapsed}
                        onToggle={() => toggleNode(division.id)}
                        onSelect={() => onSelect(division.id)}
                        onAdd={() => onAddCompany(division.id)}
                      />

                      {!divisionCollapsed && (
                        <div className="company-list-wrapper">
                          {divisionCompanies.length === 0 ? (
                            <div className="empty-company-state">
                              No companies yet
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
          style={{
            top: popupPosition.top,
            left: popupPosition.left,
          }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <div className="company-hover-popup-header">
            <h3>{hoveredCompany.name}</h3>
          </div>

          <div className="company-hover-popup-body">
            {COMPANY_SUB_DETAILS.map((subDetail) => {
              const nodeId = getSubDetailId(
                hoveredCompany.id,
                subDetail.key,
              );

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
