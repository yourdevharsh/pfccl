export function updateCompany(updateCompanies, companyId, updater) {
  updateCompanies((current) =>
    current.map((company) =>
      company.id === companyId ? updater(company) : company,
    ),
  );
}
