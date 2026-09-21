import { labelFromStatus, statusTone } from "./dataHelpers";
import "./statusPill.css";

function StatusPill({ value, fallback = "Not recorded" }) {
  const label = labelFromStatus(value, fallback);
  return <span className={`status-pill status-pill-${statusTone(value)}`}>{label}</span>;
}

export default StatusPill;
