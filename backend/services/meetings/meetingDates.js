function parseDateOnly(value) {
  if (!value) return null;
  const raw = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
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

function financialQuarter(date) {
  const month = date.getUTCMonth() + 1;
  if (month >= 4 && month <= 6) return `Q1-${date.getUTCFullYear()}`;
  if (month >= 7 && month <= 9) return `Q2-${date.getUTCFullYear()}`;
  if (month >= 10 && month <= 12) return `Q3-${date.getUTCFullYear()}`;
  return `Q4-${month <= 3 ? date.getUTCFullYear() - 1 : date.getUTCFullYear()}`;
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
  financialQuarter,
  daysUntil,
  addDays,
  startOfUtcDay,
};
