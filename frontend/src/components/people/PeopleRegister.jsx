import { useMemo } from "react";
import { DateField, NumberField, SelectField, TextField } from "../ui/FormField";
import StatusPill from "../ui/StatusPill";
import { normalizeRows } from "../ui/dataHelpers";
import "./peopleRegister.css";

function newId(prefix) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

const DIRECTOR_EMPTY = { name: "", din: "", designation: "", appointmentDate: "", cessationDate: "", status: "ACTIVE" };
const SHAREHOLDER_EMPTY = { name: "", shares: "", percentage: "", class: "", asOfDate: "" };

export function PeopleRegister({ kind, rows, onChange, companyId }) {
  const normalized = useMemo(() => normalizeRows(rows), [rows]);
  const isDirector = kind === "directors";
  const label = isDirector ? "Directors" : "Shareholders";
  const template = isDirector ? DIRECTOR_EMPTY : SHAREHOLDER_EMPTY;

  function persistRows(nextRows) {
    onChange(nextRows.map(({ __rowId, ...row }) => row));
  }

  function updateRow(rowId, patch) {
    persistRows(normalized.map((row) => row.__rowId === rowId ? { ...row, ...patch, id: row.id || row.__rowId } : row));
  }

  function addRow() {
    persistRows([...normalized, { ...template, id: newId(isDirector ? "director" : "shareholder") }]);
  }

  function removeRow(rowId) {
    persistRows(normalized.filter((row) => row.__rowId !== rowId));
  }

  return (
    <div className={`people-register people-register-${kind}`}>
      <div className="people-register-head">
        <div><h3 className="detail-card-title">{label}</h3><p className="detail-card-caption">Edit records directly here; changes are saved through the company master-data endpoint.</p></div>
        <div className="people-register-actions" data-ai-ignore="true"><span className="data-count-badge">{normalized.length}</span><button type="button" className="detail-button" onClick={addRow}>+ Add {isDirector ? "director" : "shareholder"}</button></div>
      </div>

      {normalized.length === 0 ? (
        <div className="people-register-empty">No {label.toLowerCase()} recorded yet. Use the add button to create the first record.</div>
      ) : (
        <div className="people-register-list">
          {normalized.map((row) => (
            <article className="person-row" key={row.__rowId}>
              {isDirector ? (
                <div className="person-row-grid director-grid">
                  <TextField label="Name" value={row.name ?? row.directorName ?? ""} onChange={(e) => updateRow(row.__rowId, { name: e.target.value })} aiField={{ name: "Director name", companyId, detailKey: "master-data", path: "directors.name" }} />
                  <TextField label="DIN" value={row.din ?? row.DIN ?? ""} onChange={(e) => updateRow(row.__rowId, { din: e.target.value })} aiField={{ name: "Director DIN", companyId, detailKey: "master-data", path: "directors.din" }} />
                  <TextField label="Designation" value={row.designation ?? row.role ?? ""} onChange={(e) => updateRow(row.__rowId, { designation: e.target.value })} aiField={{ name: "Director designation", companyId, detailKey: "master-data", path: "directors.designation" }} />
                  <DateField label="Appointment" value={row.appointmentDate ?? ""} onChange={(e) => updateRow(row.__rowId, { appointmentDate: e.target.value })} aiField={{ name: "Director appointment date", companyId, detailKey: "master-data", path: "directors.appointmentDate" }} />
                  <DateField label="Cessation" value={row.cessationDate ?? ""} onChange={(e) => updateRow(row.__rowId, { cessationDate: e.target.value })} aiField={{ name: "Director cessation date", companyId, detailKey: "master-data", path: "directors.cessationDate" }} />
                  <SelectField label="Status" value={row.status ?? "ACTIVE"} onChange={(e) => updateRow(row.__rowId, { status: e.target.value })} options={[{ value: "ACTIVE", label: "Active" }, { value: "CEASED", label: "Ceased" }]} aiField={{ name: "Director status", companyId, detailKey: "master-data", path: "directors.status" }} />
                </div>
              ) : (
                <div className="person-row-grid shareholder-grid">
                  <TextField label="Shareholder" value={row.name ?? row.shareholderName ?? ""} onChange={(e) => updateRow(row.__rowId, { name: e.target.value })} aiField={{ name: "Shareholder name", companyId, detailKey: "master-data", path: "shareholders.name" }} />
                  <NumberField label="Shares" min="0" value={row.shares ?? row.numberOfShares ?? ""} onChange={(e) => updateRow(row.__rowId, { shares: e.target.value })} aiField={{ name: "Shares", companyId, detailKey: "master-data", path: "shareholders.shares" }} />
                  <NumberField label="Holding %" min="0" max="100" step="0.01" value={row.percentage ?? row.shareholdingPercentage ?? ""} onChange={(e) => updateRow(row.__rowId, { percentage: e.target.value })} aiField={{ name: "Shareholding percentage", companyId, detailKey: "master-data", path: "shareholders.percentage" }} />
                  <TextField label="Class" value={row.class ?? row.shareClass ?? ""} onChange={(e) => updateRow(row.__rowId, { class: e.target.value })} aiField={{ name: "Share class", companyId, detailKey: "master-data", path: "shareholders.class" }} />
                  <DateField label="As of" value={row.asOfDate ?? ""} onChange={(e) => updateRow(row.__rowId, { asOfDate: e.target.value })} aiField={{ name: "Shareholding as-of date", companyId, detailKey: "master-data", path: "shareholders.asOfDate" }} />
                </div>
              )}
              <div className="person-row-footer">
                <StatusPill value={isDirector ? row.status : "Recorded"} label={isDirector ? undefined : "Recorded"} />
                <button type="button" className="detail-button danger-button" onClick={() => removeRow(row.__rowId)}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
