import { resolveSelection } from "../../../07-utils/selection";
import PfcclDetails from "./01-root/PfcclDetails";
import DivisionDetails from "./02-division/DivisionDetails";
import CompanyDetails from "./03-company/CompanyDetails";
import MasterDataDetails from "./04-company-sections/01-master-data/MasterDataDetails";
import MeetingsDetails from "./04-company-sections/02-meetings/MeetingsDetails";
import FilingsDetails from "./04-company-sections/03-filings/FilingsDetails";
import TransferDetails from "./04-company-sections/04-transfer/TransferDetails";
import CertificatesDetails from "./04-company-sections/05-certificates/CertificatesDetails";
import MiscDetails from "./04-company-sections/06-miscellaneous/MiscDetails";
import "./generalDetails.css";

export default function GeneralDetails({
  selectedNodeId,
  companies,
  root,
  updateCompanies,
  onSelect,
  onOpenFile,
  onUploadFiles,
  onDeleteFile,
  loadingDetail,
  meetingFocus,
  meetingsByCompany,
  meetingDashboard,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onRecordEarlyBoardMeeting,
  onOpenCompanyMeeting,
}) {
  const selection = resolveSelection(selectedNodeId, companies);
  const topLevel = new Set(["pfccl", "umpp", "itp"]);
  if (!topLevel.has(selectedNodeId) && selection.type === "empty") {
    return (
      <div className="detail-empty-state">
        <h2>Loading details…</h2>
        <p>Fetching the selected company from the repository.</p>
      </div>
    );
  }
  if (loadingDetail && selection.type === "sub-detail")
    return (
      <div className="detail-empty-state">
        <h2>Loading details…</h2>
        <p>Fetching this section from the repository.</p>
      </div>
    );

  switch (selection.type) {
    case "root":
      return (
        <PfcclDetails
          companies={companies}
          root={root}
          onSelect={onSelect}
          meetingDashboard={meetingDashboard}
          onRecordEarlyBoardMeeting={onRecordEarlyBoardMeeting}
          onOpenCompanyMeeting={onOpenCompanyMeeting}
        />
      );
    case "division":
      return (
        <DivisionDetails
          division={selection.division}
          companies={companies}
          onSelect={onSelect}
          onOpenCompanyMeeting={onOpenCompanyMeeting}
          meetingDashboard={meetingDashboard}
        />
      );
    case "company": {
      const meetingRow = (meetingDashboard?.companies || []).find(
        (row) => row.companyId === selection.company.id,
      );
      return (
        <CompanyDetails
          company={selection.company}
          updateCompanies={updateCompanies}
          onSelect={onSelect}
          onOpenCompanyMeeting={onOpenCompanyMeeting}
          meetingRow={meetingRow}
          onRecordEarlyBoardMeeting={onRecordEarlyBoardMeeting}
        />
      );
    }
    case "sub-detail": {
      const props = {
        company: selection.company,
        updateCompanies,
        onOpenFile,
        onUploadFiles,
        onDeleteFile,
        meetingFocus,
        meetingRecords: meetingsByCompany?.[selection.company.id] || [],
        meetingRow: (meetingDashboard?.companies || []).find(
          (row) => row.companyId === selection.company.id,
        ),
        onCreateMeeting,
        onUpdateMeeting,
        onDeleteMeeting,
        onRecordEarlyBoardMeeting,
      };
      switch (selection.detailKey) {
        case "master-data":
          return <MasterDataDetails {...props} />;
        case "meetings":
          return <MeetingsDetails {...props} />;
        case "filings":
          return <FilingsDetails {...props} />;
        case "transfer":
          return <TransferDetails {...props} />;
        case "certificates":
          return <CertificatesDetails {...props} />;
        case "miscellaneous":
          return <MiscDetails {...props} />;
        default:
          return null;
      }
    }
    default:
      return (
        <div className="detail-empty-state">
          <h2>Select a tree node</h2>
          <p>Choose PFCCL, a division, a company, or a company sub-detail.</p>
        </div>
      );
  }
}
