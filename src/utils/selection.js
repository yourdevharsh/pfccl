import { COMPANY_SUB_DETAILS } from "../config/treeConfig";

export function resolveSelection(selectedNodeId, companies) {
  if (!selectedNodeId) {
    return { type: "empty" };
  }

  if (selectedNodeId === "pfccl") {
    return { type: "root" };
  }

  if (selectedNodeId === "umpp" || selectedNodeId === "itp") {
    return {
      type: "division",
      division: selectedNodeId,
    };
  }

  const company = companies.find((item) => item.id === selectedNodeId);

  if (company) {
    return {
      type: "company",
      company,
    };
  }

  for (const item of companies) {
    const subDetail = COMPANY_SUB_DETAILS.find(
      ({ key }) => `${item.id}-${key}` === selectedNodeId,
    );

    if (subDetail) {
      return {
        type: "sub-detail",
        company: item,
        detailKey: subDetail.key,
        detailName: subDetail.name,
      };
    }
  }

  return { type: "empty" };
}
