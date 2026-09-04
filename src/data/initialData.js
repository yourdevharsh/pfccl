export function createCompanyRecord({ id, name, division }) {
  return {
    id,
    name,
    division,
    master: {
      id: `${id}-master-data`,
      cin: "",
      pan: "",
      gstin: "",
      tan: "",
      misc: {},
    },
    meetings: {
      id: `${id}-meetings`,
      bm: {
        numberOfAgendas: 0,
        minutes: { notes: "" },
      },
      gm: {
        egm: { notes: "" },
        agm: { notes: "" },
      },
      misc: { notes: "" },
    },
    filings: {
      id: `${id}-filings`,
      roc: {
        incorporation: { notes: "" },
        annualFilings: { notes: "" },
      },
      misc: { notes: "" },
    },
    transfer: {
      id: `${id}-transfer`,
      docs: { notes: "" },
      projectDetails: { notes: "" },
      transfereeDetails: { notes: "" },
      transfererDetails: { notes: "" },
      misc: { notes: "" },
    },
    certificates: {
      id: `${id}-certificates`,
      coi: null,
      moa: null,
      aoa: null,
      gst: null,
      espf: null,
    },
    misc: {
      id: `${id}-miscellaneous`,
      notes: "",
    },
  };
}

export const initialCompanies = [
  createCompanyRecord({ id: "umpp-1", name: "Company A", division: "umpp" }),
  createCompanyRecord({ id: "umpp-2", name: "Company B", division: "umpp" }),
  createCompanyRecord({ id: "umpp-3", name: "Company C", division: "umpp" }),
  createCompanyRecord({ id: "itp-1", name: "Company A", division: "itp" }),
  createCompanyRecord({ id: "itp-2", name: "Company B", division: "itp" }),
  createCompanyRecord({ id: "itp-3", name: "Company C", division: "itp" }),
];
