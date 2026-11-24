// A text cell holding a whole ISO date or timestamp reads as a date in the shadcn look: builds bound raw query rows,
// and a designed table showing 2026-10-12 read as unfinished. Everything else is left to the cell.
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

export const isoDateLabel = (value, locale) => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  const day = DATE.exec(v);
  if (day) {
    const d = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
    if (d.getMonth() !== Number(day[2]) - 1) return null;
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  }
  if (STAMP.test(v)) {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  }
  return null;
};
