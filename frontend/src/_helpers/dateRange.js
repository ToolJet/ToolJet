/**
 * `<input type="date">` yields a bare `YYYY-MM-DD`: a calendar day in the *user's* timezone, with
 * nothing on it to say so. Sent as-is it is read as a UTC instant at midnight, which as an upper
 * bound excludes the whole day the user picked — "to today" returns nothing created today.
 *
 * So convert the picked day into the instant it starts or ends at locally, offset included.
 * `new Date(y, m, d, …)` constructs in local time; `toISOString()` renders the instant. Only the
 * browser knows the viewer's timezone, so the page is what resolves it. A value that already
 * carries a time is passed straight through.
 */
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
