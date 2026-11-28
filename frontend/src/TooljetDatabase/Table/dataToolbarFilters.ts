import { operators } from '@/_helpers/constants';

export interface QueryFilter {
  column?: string;
  operator?: string;
  value?: string;
}

export interface ToolbarFilter {
  /** The key in the store's `queryFilters`, so a chip can remove its own filter. */
  id: string;
  label: string;
}

const OPERATOR_LABELS: Record<string, string> = Object.fromEntries(
  (operators as { value: string; label: string }[]).map(({ value, label }) => [value, label])
);

const NUMERIC = /^-?\d+(\.\d+)?$/;

// "title equals "feature"", "id greater than 20": text is quoted, numbers are not.
function formatFilterLabel({ column, operator, value }: Required<QueryFilter>): string {
  const shown = NUMERIC.test(value) ? value : `"${value}"`;
  return `${column} ${OPERATOR_LABELS[operator] ?? operator} ${shown}`;
}

// Chips for the filters that are complete: a half-filled row in the filter popover is not applied, so it has no chip.
export function toToolbarFilters(queryFilters: Record<string, QueryFilter>): ToolbarFilter[] {
  return Object.keys(queryFilters)
    .sort((a, b) => Number(a) - Number(b))
    .flatMap((id) => {
      const { column, operator, value } = queryFilters[id] ?? {};
      return column && operator && value ? [{ id, label: formatFilterLabel({ column, operator, value }) }] : [];
    });
}

// ponytail: a fixed count, as in the design ("the first two chips stay"). Measure the row (ResizeObserver) if a
// caller needs the split to follow the available width.
export function splitFilters<T>(filters: T[], maxVisible: number): { visible: T[]; overflow: T[] } {
  return { visible: filters.slice(0, maxVisible), overflow: filters.slice(maxVisible) };
}
