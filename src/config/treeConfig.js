export const ROOT_NODE = {
  id: "pfccl",
  name: "PFCCL",
};

export const DIVISIONS = [
  { id: "umpp", name: "UMPP" },
  { id: "itp", name: "ITP" },
];

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
  return Array.from(
    { length: Math.max(currentYear - 2021 + 1, 1) },
    (_, index) => 2021 + index,
  );
}

export function getSubDetailId(companyId, subDetailKey) {
  return `${companyId}-${subDetailKey}`;
}

export function getNextCompanyId(companies, division) {
  const prefix = division === "umpp" ? "umpp" : "itp";
  const usedNumbers = companies
    .filter((company) => company.division === division)
    .map((company) =>
      Number(company.id.match(new RegExp(`^${prefix}-(\\d+)$`))?.[1]),
    )
    .filter(Number.isFinite);

  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
  return `${prefix}-${nextNumber}`;
}
