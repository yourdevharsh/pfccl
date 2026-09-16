export const ROOT_NODE_ID = "pfccl";

// These are UI route definitions, not repository data. Repository records are fetched from the API.
export const COMPANY_SUB_DETAILS = [
  { key: "master-data", name: "Master Data" },
  { key: "meetings", name: "Meetings" },
  { key: "filings", name: "Filings" },
  { key: "transfer", name: "Transfer" },
  { key: "certificates", name: "Certificates" },
  { key: "miscellaneous", name: "Miscellaneous" },
];

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function getCompanyYears() {
  const currentYear = getCurrentYear();
  return Array.from({ length: Math.max(currentYear - 2021 + 1, 1) }, (_, index) => 2021 + index);
}

export function getSubDetailId(companyId, subDetailKey) {
  return `${companyId}-${subDetailKey}`;
}
