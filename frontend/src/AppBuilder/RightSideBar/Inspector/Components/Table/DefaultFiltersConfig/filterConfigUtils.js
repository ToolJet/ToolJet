import { v4 as uuidv4 } from 'uuid';
import { FILTER_OPTIONS } from '@/AppBuilder/Widgets/NewTable/_components/Header/_components/Filter/filterConstants';

const NON_FILTERABLE_COLUMN_TYPES = ['button'];
const NO_VALUE_CONDITIONS = ['isEmpty', 'isNotEmpty'];

export const getFilterableColumns = (columns) =>
  Array.isArray(columns) ? columns.filter((column) => !NON_FILTERABLE_COLUMN_TYPES.includes(column.columnType)) : [];

// is empty / is not empty are the only operators that ignore the value
export const needsValue = (condition) => !NO_VALUE_CONDITIONS.includes(condition);

export const createDefaultFilter = (columns) => {
  const [firstColumn] = getFilterableColumns(columns);
  return firstColumn ? { id: uuidv4(), column: firstColumn.id, condition: 'contains', value: '' } : null;
};

export const describeFilter = (filter, columns) => {
  const column = getFilterableColumns(columns).find(({ id }) => id === filter.column);
  const operator = FILTER_OPTIONS.find(({ value }) => value === filter.condition)?.name ?? filter.condition;
  const title = `${column?.name ?? 'Column'} ${operator}`;
  return needsValue(filter.condition) ? `${title}…` : title;
};

export const moveFilter = (filters, from, to) => {
  const inRange = (index) => Number.isInteger(index) && index >= 0 && index < filters.length;
  if (from === to || !inRange(from) || !inRange(to)) return filters;
  const moved = [...filters];
  const [item] = moved.splice(from, 1);
  moved.splice(to, 0, item);
  return moved;
};

// The popup is positioned against the properties panel the cog sits in, so it opens beside the panel, not over it.
export const getPanelRect = (element) => (element.closest('.inspector') ?? element).getBoundingClientRect();

// Offsets that put a popup opening to the left of `element` against the panel instead: its right edge `gap` before
// the panel's left edge, its top at the panel's top.
export const getPanelPlacement = (element, gap) => {
  const panel = getPanelRect(element);
  const rect = element.getBoundingClientRect();
  return { sideOffset: rect.left - panel.left + gap, alignOffset: panel.top - rect.top };
};
