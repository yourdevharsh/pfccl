import { useRef, useState } from "react";
import TreeNode from "./TreeNode";
import "./companyTree.css";

function CompanyTree({
  companies,
  selectedCompanyId,
  onSelect,
  onAddCompany,
  onDeleteCompany,
}) {
  const [collapsed, updateCollapsed] = useState({
    pfcll: false,
    umpp: false,
    itp: false,
  });

  // =========================================================
  // COMPANY HOVER POPUP STATE
  // =========================================================

  const [hoveredCompany, setHoveredCompany] = useState(null);

  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
  });

  const hidePopupTimer = useRef(null);

  // =========================================================
  // COLLAPSE
  // =========================================================

  function toggleNode(id) {
    updateCollapsed((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  // =========================================================
  // COMPANY HOVER
  // =========================================================

  function handleCompanyMouseEnter(company, event) {
    // Cancel pending popup hide
    if (hidePopupTimer.current) {
      clearTimeout(hidePopupTimer.current);
      hidePopupTimer.current = null;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setHoveredCompany(company);

    setPopupPosition({
      top: rect.top,
      left: rect.right + 6,
    });
  }

  function handleCompanyMouseLeave() {
    // Don't immediately hide.
    // Give the user a moment to move into the popup.
    hidePopupTimer.current = setTimeout(() => {
      setHoveredCompany(null);
      hidePopupTimer.current = null;
    }, 150);
  }

  function handlePopupMouseEnter() {
    // User successfully reached the popup.
    // Cancel the pending hide.
    if (hidePopupTimer.current) {
      clearTimeout(hidePopupTimer.current);
      hidePopupTimer.current = null;
    }
  }

  function handlePopupMouseLeave() {
    // User left the popup.
    setHoveredCompany(null);
  }

  // =========================================================
  // COMPANIES
  // =========================================================

  const umppCompanies = companies.filter(
    (company) => company.division === "umpp",
  );

  const itpCompanies = companies.filter(
    (company) => company.division === "itp",
  );

  return (
    <div className="tree-wrapper">
      <div className="org-tree">

        {/* =====================================================
            PFCCL
        ===================================================== */}

        <div className="root-row">
          <TreeNode
            type="root"
            name="PFCCL"
            collapsed={collapsed.pfcll}
            onToggle={() => toggleNode("pfcll")}
          />
        </div>

        {!collapsed.pfcll && (
          <>
            {/* PFCCL vertical line */}
            <div className="root-drop" />

            {/* =================================================
                UMPP + ITP AREA
            ================================================= */}

            <div className="division-stage">

              {/* One continuous horizontal line */}
              <div className="root-horizontal" />

              <div className="division-row">

                {/* =================================================
                    UMPP
                ================================================= */}

                <div className="division-branch">
                  <TreeNode
                    type="division"
                    name="UMPP"
                    collapsed={collapsed.umpp}
                    onToggle={() => toggleNode("umpp")}
                    onAdd={() => onAddCompany("umpp")}
                  />

                  {!collapsed.umpp && (
                    <CompanyList
                      companies={umppCompanies}
                      selectedCompanyId={selectedCompanyId}
                      onSelect={onSelect}
                      onDeleteCompany={onDeleteCompany}
                      onCompanyMouseEnter={handleCompanyMouseEnter}
                      onCompanyMouseLeave={handleCompanyMouseLeave}
                    />
                  )}
                </div>

                {/* =================================================
                    ITP
                ================================================= */}

                <div className="division-branch">
                  <TreeNode
                    type="division"
                    name="ITP"
                    collapsed={collapsed.itp}
                    onToggle={() => toggleNode("itp")}
                    onAdd={() => onAddCompany("itp")}
                  />

                  {!collapsed.itp && (
                    <CompanyList
                      companies={itpCompanies}
                      selectedCompanyId={selectedCompanyId}
                      onSelect={onSelect}
                      onDeleteCompany={onDeleteCompany}
                      onCompanyMouseEnter={handleCompanyMouseEnter}
                      onCompanyMouseLeave={handleCompanyMouseLeave}
                    />
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* =========================================================
          SINGLE SHARED COMPANY POPUP

          This is intentionally OUTSIDE the company <ul>.
      ========================================================= */}

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
          {/* =====================================================
              POPUP HEADER
          ===================================================== */}

          <div className="company-hover-popup-header">
            <h3>{hoveredCompany.name}</h3>
          </div>

          {/* =====================================================
              POPUP BODY
          ===================================================== */}

          <div className="company-hover-popup-body">

            {hoveredCompany.description && (
              <div className="company-detail">
                <span className="company-detail-label">
                  Description
                </span>

                <span className="company-detail-value">
                  {hoveredCompany.description}
                </span>
              </div>
            )}

            {hoveredCompany.division && (
              <div className="company-detail">
                <span className="company-detail-label">
                  Division
                </span>

                <span className="company-detail-value">
                  {hoveredCompany.division.toUpperCase()}
                </span>
              </div>
            )}

            {hoveredCompany.location && (
              <div className="company-detail">
                <span className="company-detail-label">
                  Location
                </span>

                <span className="company-detail-value">
                  {hoveredCompany.location}
                </span>
              </div>
            )}

            {hoveredCompany.website && (
              <div className="company-detail">
                <span className="company-detail-label">
                  Website
                </span>

                <span className="company-detail-value">
                  {hoveredCompany.website}
                </span>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPANY LIST
========================================================= */

function CompanyList({
  companies,
  selectedCompanyId,
  onSelect,
  onDeleteCompany,
  onCompanyMouseEnter,
  onCompanyMouseLeave,
}) {
  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="company-list-wrapper">
      <ul className="company-list">
        {companies.map((company) => (
          <li
            key={company.id}
            className={`company-list-item ${
              company.id === selectedCompanyId ? "selected" : ""
            }`}
            onMouseEnter={(event) =>
              onCompanyMouseEnter(company, event)
            }
            onMouseLeave={onCompanyMouseLeave}
          >
            <span
              className="company-name"
              onClick={() => onSelect(company.id)}
            >
              {company.name}
            </span>

            <button
              type="button"
              className="company-list-delete"
              onClick={() => onDeleteCompany(company.id)}
              title="Delete company"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CompanyTree;