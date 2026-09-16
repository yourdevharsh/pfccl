export function mergeCompanyIntoList(current, incoming) {
  if (!incoming?.id) return current;
  const exists = current.some((company) => company.id === incoming.id);
  if (!exists) return [...current, incoming];
  return current.map((company) =>
    company.id === incoming.id ? { ...company, ...incoming } : company,
  );
}

export function mergeDetailIntoCompany(company, detailKey, detailData) {
  if (!company || detailData == null) return company;

  // Detail endpoints may return either the detail object directly or
  // { data: <detail> }. Both forms are intentionally supported.
  const data = detailData.data ?? detailData;
  const property = {
    "master-data": "master",
    meetings: "meetings",
    filings: "filings",
    transfer: "transfer",
    certificates: "certificates",
    miscellaneous: "misc",
  }[detailKey] || detailKey;

  return { ...company, [property]: data };
}
