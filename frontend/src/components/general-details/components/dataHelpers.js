export function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

export function readPath(source, path) {
  return path.split(".").reduce((current, key) => current?.[key], source);
}

export function firstPath(source, paths, fallback = "") {
  for (const path of paths) {
    const value = readPath(source, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

export function normalizeRows(value) {
  return asArray(value).filter(Boolean).map((row, index) => ({
    ...((row && typeof row === "object") ? row : { name: row }),
    __rowId: row?.id ?? `${index}-${String(row?.name ?? row ?? "row")}`,
  }));
}

export function formatDate(value, fallback = "Not recorded") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function daysFromToday(value) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export function cleanNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function labelFromStatus(value, fallback = "Not recorded") {
  if (!value && value !== 0) return fallback;
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function statusTone(value) {
  const normalized = String(value ?? "").toLowerCase();
  if (["active", "completed", "complete", "on track", "scheduled", "filed", "approved"].some((token) => normalized.includes(token))) return "success";
  if (["pending", "upcoming", "in progress", "draft", "under process", "due"].some((token) => normalized.includes(token))) return "warning";
  if (["overdue", "rejected", "failed", "cancelled", "closed"].some((token) => normalized.includes(token))) return "danger";
  if (["transferred", "inactive", "dormant"].some((token) => normalized.includes(token))) return "neutral";
  return "neutral";
}

export function getCompanyDirectors(company) {
  return normalizeRows(firstDefined(
    company?.directors,
    company?.master?.directors,
    company?.masterData?.directors,
    company?.governance?.directors,
  ));
}

export function getCompanyShareholders(company) {
  return normalizeRows(firstDefined(
    company?.shareholders,
    company?.shareholding?.shareholders,
    company?.master?.shareholders,
    company?.masterData?.shareholders,
    company?.ownership?.shareholders,
  ));
}

export function getBoardMeetingRecords(company) {
  return normalizeRows(firstDefined(
    company?.meetings?.bm?.records,
    company?.meetings?.bm?.meetings,
    company?.meetings?.records,
    company?.boardMeetings,
  ));
}

export function getFilingRecords(company) {
  return normalizeRows(firstDefined(
    company?.filings?.records,
    company?.filings?.forms,
    company?.filings?.roc?.records,
    company?.filingRecords,
  ));
}

export function getTransferData(company) {
  return firstDefined(
    company?.transfer?.record,
    company?.transfer?.details,
    company?.transfer,
    company?.lifecycle?.transfer,
    {},
  );
}

export function countPending(items, statusKeys = ["pending", "due", "overdue"]) {
  return items.filter((item) => statusKeys.some((key) => String(item?.status ?? "").toLowerCase().includes(key))).length;
}
