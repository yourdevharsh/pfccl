import FileField from "../../../../../02-features/documents/FileField";
import StatusPill from "../../../../../03-shared/ui/StatusPill";
import CompactTable from "../../../../../03-shared/ui/CompactTable";
import {
  countPending,
  getFilingRecords,
  firstPath,
  formatDate,
} from "../../../../../03-shared/ui/dataHelpers";
import "./filingsDetails.css";

const FILING_FIELDS = [
  ["roc.incorporation", "Incorporation"],
  ["roc.annualFilings", "Annual Filings"],
  ["misc", "Miscellaneous"],
];

function readFiles(filings, path) {
  if (path === "misc") return filings.misc?.files ?? [];
  const [section, field] = path.split(".");
  return filings[section]?.[field]?.files ?? [];
}

function FilingsDetails({ company, onOpenFile, onUploadFiles, onDeleteFile }) {
  const filings = company.filings ?? {};
  const records = getFilingRecords(company);
  const pending = countPending(records);
  const rocStatus = firstPath(
    filings,
    ["roc.status", "status"],
    "Not recorded",
  );

  const columns = [
    {
      key: "form",
      label: "Form",
      render: (row) => row.form ?? row.formType ?? row.name ?? "—",
    },
    {
      key: "period",
      label: "Period",
      render: (row) => row.period ?? row.financialYear ?? "—",
    },
    { key: "dueDate", label: "Due", render: (row) => formatDate(row.dueDate) },
    {
      key: "filedDate",
      label: "Filed",
      render: (row) => formatDate(row.filedDate ?? row.date),
    },
    { key: "srn", label: "SRN", render: (row) => row.srn ?? "—" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusPill value={row.status} />,
    },
  ];

  return (
    <div
      className="detail-page filings-details"
      data-ai-company-id={company.id}
      data-ai-detail-key="filings"
      data-ai-section="true"
      data-ai-section-name="Filings"
    >
      <div className="detail-header">
        <div className="detail-eyebrow">FILINGS</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">
          ROC documents plus a compact filing register.
        </p>
      </div>

      <div className="filing-pulse-grid">
        <div>
          <span>Total tracked</span>
          <strong>{records.length}</strong>
        </div>
        <div>
          <span>Pending / due</span>
          <strong>{pending}</strong>
        </div>
        <div>
          <span>ROC status</span>
          <strong>
            <StatusPill value={rocStatus} />
          </strong>
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-card-heading-row">
          <div>
            <h3 className="detail-card-title">Filing register</h3>
            <p className="detail-card-caption">
              Use this view for the operational information currently maintained
              in the workbook.
            </p>
          </div>
          <span className="data-count-badge">{records.length}</span>
        </div>
        <CompactTable
          columns={columns}
          rows={records}
          empty="No structured filing records are available yet."
        />
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Filing documents</h3>
        <div className="detail-form-grid">
          {FILING_FIELDS.map(([field, label]) => (
            <div className="detail-field full-width" key={field}>
              <FileField
                label={label}
                field={field}
                detailKey="filings"
                companyId={company.id}
                value={readFiles(filings, field)}
                onUpload={onUploadFiles}
                onDeleteFile={onDeleteFile}
                onOpenFile={onOpenFile}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default FilingsDetails;
