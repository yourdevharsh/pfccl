import { statusTone, labelFromStatus } from "./dataHelpers";
import "./statusPill.css";

export default function StatusPill({ value, label }) {
  const tone = statusTone(value);
  return (
    <span className={`status-pill status-pill-${tone}`}>
      {label ?? labelFromStatus(value)}
    </span>
  );
}
