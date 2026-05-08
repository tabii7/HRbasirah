function getMonthRange(month) {
  const [yearText, monthText] = String(month).split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText);
  if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) return null;
  const monthStart = new Date(Date.UTC(year, monthIndex - 1, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex, 0));
  return { monthStart, monthEnd, daysInMonth: monthEnd.getUTCDate() };
}

function overlapDays(startA, endA, startB, endB) {
  const start = Math.max(startA.getTime(), startB.getTime());
  const end = Math.min(endA.getTime(), endB.getTime());
  if (start > end) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

function diffDaysInclusive(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) return null;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function toIsoDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function parseJoinedDateUtc(iso) {
  if (!iso || !String(iso).trim()) return null;
  const day = String(iso).trim().slice(0, 10);
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

module.exports = {
  getMonthRange,
  overlapDays,
  diffDaysInclusive,
  toIsoDateOnly,
  parseJoinedDateUtc,
};
