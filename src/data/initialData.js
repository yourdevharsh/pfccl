export function createCompanyRecord({ id, name, division, incorporationDate }) {
  return {
    id,
    name,
    division,
    incorporationDate: incorporationDate ?? new Date().toISOString().slice(0, 10),
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
        numberOfMeetings: 0,
        minutes: { files: [] },
      },
      gm: {
        egm: { files: [] },
        agm: { files: [] },
      },
      misc: { files: [] },
    },
    filings: {
      id: `${id}-filings`,
      roc: {
        incorporation: { files: [] },
        annualFilings: { files: [] },
      },
      misc: { files: [] },
    },
    transfer: {
      id: `${id}-transfer`,
      docs: { files: [] },
      projectDetails: { files: [] },
      transfereeDetails: { files: [] },
      transfererDetails: { files: [] },
      misc: { files: [] },
    },
    certificates: {
      id: `${id}-certificates`,
      coi: [],
      moa: [],
      aoa: [],
      gst: [],
      espf: [],
    },
    misc: {
      id: `${id}-miscellaneous`,
      notes: "",
    },
  };
}

export const initialCompanies = [
  createCompanyRecord({
    id: "umpp-1",
    name: "Company A",
    division: "umpp",
    incorporationDate: "2021-04-12",
  }),
  createCompanyRecord({
    id: "umpp-2",
    name: "Company B",
    division: "umpp",
    incorporationDate: "2022-08-19",
  }),
  createCompanyRecord({
    id: "umpp-3",
    name: "Company C",
    division: "umpp",
    incorporationDate: "2024-02-05",
  }),
  createCompanyRecord({
    id: "itp-1",
    name: "Company A",
    division: "itp",
    incorporationDate: "2021-11-09",
  }),
  createCompanyRecord({
    id: "itp-2",
    name: "Company B",
    division: "itp",
    incorporationDate: "2023-06-21",
  }),
  createCompanyRecord({
    id: "itp-3",
    name: "Company C",
    division: "itp",
    incorporationDate: "2025-01-15",
  }),
];
