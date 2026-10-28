// Bare YYYY-MM-DD widened to its UTC day edges; timestamps with an offset pass through.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parse(value: string | undefined, dayEdge: 'start' | 'end'): Date | undefined {
  if (!value) return undefined;
  const iso = DATE_ONLY.test(value) ? `${value}${dayEdge === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z'}` : value;
  const parsed = new Date(iso);
  // Invalid Date compares as NULL in SQL and silently drops every row.
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function parseApprovalRangeStart(value?: string): Date | undefined {
  return parse(value, 'start');
}

export function parseApprovalRangeEnd(value?: string): Date | undefined {
  return parse(value, 'end');
}
