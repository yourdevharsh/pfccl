import { resolveSelection } from "../../utils/selection";
import PfcclDetails from "./details/PfcclDetails";
import DivisionDetails from "./details/DivisionDetails";
import CompanyDetails from "./details/CompanyDetails";
import MasterDataDetails from "./details/MasterDataDetails";
import MeetingsDetails from "./details/MeetingsDetails";
import FilingsDetails from "./details/FilingsDetails";
import TransferDetails from "./details/TransferDetails";
import CertificatesDetails from "./details/CertificatesDetails";
import MiscDetails from "./details/MiscDetails";
import "./generalDetails.css";

function GeneralDetails({ selectedNodeId, companies, root, updateCompanies, onSelect, onOpenFile, onUploadFiles, onDeleteFile, loadingDetail }) {
  const selection = resolveSelection(selectedNodeId, companies);
  if (loadingDetail && selection.type === "sub-detail") {
    return <div className="detail-empty-state"><h2>Loading details…</h2><p>Fetching this section from the repository.</p></div>;
  }

  switch (selection.type) {
    case "root": return <PfcclDetails companies={companies} root={root} onSelect={onSelect} />;
    case "division": return <DivisionDetails division={selection.division} companies={companies} onSelect={onSelect} />;
    case "company": return <CompanyDetails company={selection.company} updateCompanies={updateCompanies} onSelect={onSelect} />;
    case "sub-detail": {
      const props = { company: selection.company, updateCompanies, onOpenFile, onUploadFiles, onDeleteFile };
      switch (selection.detailKey) {
        case "master-data": return <MasterDataDetails {...props} />;
        case "meetings": return <MeetingsDetails {...props} />;
        case "filings": return <FilingsDetails {...props} />;
        case "transfer": return <TransferDetails {...props} />;
        case "certificates": return <CertificatesDetails {...props} />;
        case "miscellaneous": return <MiscDetails {...props} />;
        default: return null;
      }
    }
    default: return <div className="detail-empty-state"><h2>Select a tree node</h2><p>Choose PFCCL, a division, a company, or a company sub-detail.</p></div>;
  }
}
export default GeneralDetails;
