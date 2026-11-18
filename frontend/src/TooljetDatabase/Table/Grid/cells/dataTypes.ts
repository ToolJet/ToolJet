const NUMERIC_TYPES = new Set(['integer', 'bigint', 'double precision', 'serial']);

export const isNumericType = (dataType: string): boolean => NUMERIC_TYPES.has(dataType);

// A row value as text; the cell shows NULL itself, so null never reaches here.
export const formatCellValue = (value: unknown): string =>
  typeof value === 'object' ? JSON.stringify(value) : String(value);
