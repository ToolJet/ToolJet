// Bare YYYY-MM-DD is a local day: send its local start/end instant.
export function toLocalDayBoundary(value, edge) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date =
    edge === 'start' ? new Date(year, monthIndex, day, 0, 0, 0, 0) : new Date(year, monthIndex, day, 23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}
