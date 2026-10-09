function parseDateOnly(value) {
  if (!value) return null;
  const raw =
    value instanceof Date && !Number.isNaN(value.getTime())
      ? value.toISOString().slice(0, 10)
      : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw
    ? null
    : date;
}

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcDay(value = new Date()) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function daysUntil(date, now = new Date()) {
  return Math.round(
    (startOfUtcDay(date).getTime() - startOfUtcDay(now).getTime()) / 86400000,
  );
}

function addMonths(date, months) {
  const monthIndex = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)),
  );
}

function severityForDays(days) {
  if (days < 0) return "critical";
  if (days <= 3) return "critical";
  if (days <= 7) return "high";
  if (days <= 14) return "medium";
  return "low";
}

export {
  parseDateOnly,
  formatDate,
  severityForDays,
  daysUntil,
  addDays,
  addMonths,
  startOfUtcDay,
};
