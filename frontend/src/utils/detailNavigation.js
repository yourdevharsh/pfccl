import { COMPANY_SUB_DETAILS } from "../config/treeConfig";
import { resolveSelection } from "./selection";

function getCompanyDivision(company) {
  return company?.division ?? null;
}

function getCompanyIncorporationYear(company) {
  const year = Number.parseInt(company?.incorporationDate?.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function getVisibleCompanies(companies, division, year) {
  return companies.filter((company) => {
    if (company.division !== division) return false;
    if (year === null) return true;
    return getCompanyIncorporationYear(company) === year;
  });
}

function getContext(selection, selectedYearByDivision) {
  if (selection.type === "division") {
    return {
      division: selection.division,
      year: selectedYearByDivision[selection.division] ?? null,
    };
  }

  if (selection.type === "company" || selection.type === "sub-detail") {
    return {
      division: getCompanyDivision(selection.company),
      year: getCompanyIncorporationYear(selection.company),
    };
  }

  return { division: null, year: null };
}

/**
 * Hierarchical details navigation.
 *
 * Back is intentionally parent-first rather than browser-history/flat-list
 * navigation:
 *   division -> (no back)
 *   company -> division
 *   sub-detail -> company
 *
 * Forward walks down/across the detail tree:
 *   division -> first company
 *   company -> first sub-detail
 *   sub-detail -> next sub-detail
 *   last sub-detail -> first sub-detail of the next visible company
 */
export function buildDetailNavigation({
  selectedNodeId,
  companies,
  selectedYearByDivision = {},
}) {
  const selection = resolveSelection(selectedNodeId, companies);
  const { division, year } = getContext(selection, selectedYearByDivision);

  if (!division) {
    return {
      current: null,
      previousId: null,
      nextId: null,
      previousLabel: null,
      nextLabel: null,
    };
  }

  const visibleCompanies = getVisibleCompanies(companies, division, year);
  const companyIndex = visibleCompanies.findIndex(
    (company) => company.id === selection.company?.id,
  );

  const currentCompany =
    companyIndex >= 0 ? visibleCompanies[companyIndex] : null;
  const subDetailIndex = currentCompany
    ? COMPANY_SUB_DETAILS.findIndex(
        ({ key }) => key === selection.detailKey,
      )
    : -1;

  let previousId = null;
  let previousLabel = null;
  let nextId = null;
  let nextLabel = null;

  if (selection.type === "division") {
    const firstCompany = visibleCompanies[0];
    if (firstCompany) {
      nextId = firstCompany.id;
      nextLabel = firstCompany.name;
    }
  } else if (selection.type === "company") {
    previousId = division;
    previousLabel = division.toUpperCase();

    const firstSubDetail = COMPANY_SUB_DETAILS[0];
    if (firstSubDetail) {
      nextId = `${currentCompany.id}-${firstSubDetail.key}`;
      nextLabel = `${firstSubDetail.name} · ${currentCompany.name}`;
    }
  } else if (selection.type === "sub-detail" && currentCompany) {
    previousId = currentCompany.id;
    previousLabel = currentCompany.name;

    if (subDetailIndex < COMPANY_SUB_DETAILS.length - 1) {
      const nextSubDetail = COMPANY_SUB_DETAILS[subDetailIndex + 1];
      nextId = `${currentCompany.id}-${nextSubDetail.key}`;
      nextLabel = `${nextSubDetail.name} · ${currentCompany.name}`;
    } else {
      const nextCompany = visibleCompanies[companyIndex + 1];
      const firstSubDetail = COMPANY_SUB_DETAILS[0];

      if (nextCompany && firstSubDetail) {
        nextId = `${nextCompany.id}-${firstSubDetail.key}`;
        nextLabel = `${firstSubDetail.name} · ${nextCompany.name}`;
      }
    }
  }

  return {
    current: {
      id: selectedNodeId,
      type: selection.type,
      division,
      companyId: currentCompany?.id ?? null,
      subDetailKey: selection.detailKey ?? null,
    },
    previousId,
    nextId,
    previousLabel,
    nextLabel,
  };
}
