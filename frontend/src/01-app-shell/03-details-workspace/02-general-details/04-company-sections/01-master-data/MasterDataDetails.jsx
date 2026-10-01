import {
  DateField,
  SelectField,
  TextField,
} from "../../../../../03-shared/ui/FormField";
import StatusPill from "../../../../../03-shared/ui/StatusPill";
import { PeopleRegister } from "../../../../../02-features/people/PeopleRegister";
import {
  getCompanyDirectors,
  getCompanyShareholders,
  firstPath,
  formatDate,
} from "../../../../../03-shared/ui/dataHelpers";
import "./masterDataDetails.css";

function MasterDataDetails({ company, updateCompanies }) {
  const master = company.master ?? {};
  const directors = getCompanyDirectors(company);
  const shareholders = getCompanyShareholders(company);
  const status = firstPath(
    company,
    [
      "status",
      "companyStatus",
      "master.status",
      "master.companyStatus",
      "lifecycle.status",
    ],
    "Not recorded",
  );

  function updateMasterField(field, value) {
    updateCompanies(company.id, (current) => ({
      ...current,
      master: { ...(current.master ?? {}), [field]: value },
    }));
  }

  function updatePeople(kind, nextRows) {
    updateCompanies(company.id, (current) => ({
      ...current,
      master: {
        ...(current.master ?? {}),
        [kind]: nextRows.map(({ __rowId, ...row }) => row),
      },
    }));
  }

  return (
    <div
      className="detail-page master-data-details"
      data-ai-company-id={company.id}
      data-ai-detail-key="master-data"
      data-ai-section="true"
      data-ai-section-name="Master Data"
    >
      <div className="detail-header">
        <div className="detail-eyebrow">MASTER DATA</div>
        <h2 className="detail-title">{company.name}</h2>
        <p className="detail-subtitle">
          Identity, governance and ownership at a glance.
        </p>
      </div>

      <div className="detail-card master-data-quick-grid">
        <div>
          <span>Status</span>
          <StatusPill value={status} />
        </div>
        <div>
          <span>Incorporated</span>
          <strong>{formatDate(company.incorporationDate)}</strong>
        </div>
        <div>
          <span>Directors</span>
          <strong>{directors.length}</strong>
        </div>
        <div>
          <span>Shareholders</span>
          <strong>{shareholders.length}</strong>
        </div>
      </div>

      <div className="detail-card">
        <h3 className="detail-card-title">Registered identity</h3>
        <div className="detail-form-grid">
          <TextField
            label="Company Name"
            value={company.name ?? ""}
            disabled
            aiField={{
              name: "Company Name",
              companyId: company.id,
              detailKey: "master-data",
              path: "company.name",
            }}
          />
          <TextField
            label="Division"
            value={company.division === "umpp" ? "UMPP" : "ITP"}
            disabled
            aiField={{
              name: "Division",
              companyId: company.id,
              detailKey: "master-data",
              path: "company.division",
            }}
          />
          {[
            ["cin", "CIN"],
            ["pan", "PAN"],
            ["gstin", "GSTIN"],
            ["tan", "TAN"],
            ["email", "Email"],
            ["companyType", "Company Type"],
          ].map(([field, label]) => (
            <TextField
              key={field}
              label={label}
              value={master[field] ?? company[field] ?? ""}
              onChange={(event) => updateMasterField(field, event.target.value)}
              aiField={{
                name: label,
                companyId: company.id,
                detailKey: "master-data",
                path: `master.${field}`,
              }}
            />
          ))}
          <DateField
            label="Incorporation date"
            value={company.incorporationDate ?? ""}
            onChange={(event) =>
              updateCompanies(company.id, (current) => ({
                ...current,
                incorporationDate: event.target.value,
              }))
            }
            aiField={{
              name: "Incorporation date",
              companyId: company.id,
              detailKey: "master-data",
              path: "company.incorporationDate",
            }}
          />
          <SelectField
            label="Status"
            value={company.status ?? "ACTIVE"}
            onChange={(event) =>
              updateCompanies(company.id, (current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "TRANSFERRED", label: "Transferred" },
              { value: "UNDER_INCORPORATION", label: "Under incorporation" },
              { value: "DORMANT", label: "Dormant" },
              { value: "CLOSED", label: "Closed" },
              { value: "OTHER", label: "Other" },
            ]}
            aiField={{
              name: "Company status",
              companyId: company.id,
              detailKey: "master-data",
              path: "company.status",
            }}
          />
        </div>
      </div>

      <div className="detail-card">
        <PeopleRegister
          kind="directors"
          companyId={company.id}
          rows={directors}
          onChange={(rows) => updatePeople("directors", rows)}
        />
      </div>
      <div className="detail-card">
        <PeopleRegister
          kind="shareholders"
          companyId={company.id}
          rows={shareholders}
          onChange={(rows) => updatePeople("shareholders", rows)}
        />
      </div>
    </div>
  );
}

export default MasterDataDetails;
