// Inspector values arrive as arbitrary JSON; these helpers read them defensively.

export type Row = Record<string, unknown>;

export const toRows = (raw: unknown): Row[] =>
  (Array.isArray(raw) ? raw : []).filter((r): r is Row => !!r && typeof r === 'object' && !Array.isArray(r));

// A field list given as an array or a comma-separated string: "revenue, cost".
export const toList = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

export const field = (row: Row | undefined, name: string | undefined): unknown =>
  row && name ? row[name] : undefined;

export const text = (value: unknown, fallback = ''): string =>
  value === undefined || value === null ? fallback : typeof value === 'object' ? JSON.stringify(value) : String(value);

export const num = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const rowId = (row: Row, idField: string, index: number): string => text(field(row, idField), String(index));

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
