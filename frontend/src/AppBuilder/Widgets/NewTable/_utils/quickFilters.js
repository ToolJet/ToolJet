import { FILTER_OPTIONS } from '../_components/Header/_components/Filter/filterConstants';

const NO_VALUE_CONDITIONS = ['isEmpty', 'isNotEmpty'];
// Columns whose value is picked from a list or a calendar, not typed
const PICKED_COLUMN_TYPES = [
  'select',
  'newMultiSelect',
  'tagsV2',
  'dropdown',
  'multiselect',
  'tags',
  'boolean',
  'toggle',
  'datepicker',
];

/**
 * The builder's saved filters as the chips shown in the table header. `columns` are `{ id, header, columnType }`
 * and `columnFilters` the filters the table has applied. A chip shows the value of the applied filter that
 * belongs to it (the first one on the same column and operator that no earlier chip took), or stays empty.
 */
export const getQuickFilters = (defaultFilters, columnFilters, columns) => {
  if (!Array.isArray(defaultFilters)) return [];

  // a missing list, or an odd entry in it, means "nothing applied" rather than a crash in the table header
  const appliedFilters = Array.isArray(columnFilters) ? columnFilters : [];
  const claimed = new Set();
  return defaultFilters.flatMap(({ id, column: columnId, condition }) => {
    const column = columns.find((candidate) => candidate.id === columnId);
    if (!column) return [];

    const appliedIndex = appliedFilters.findIndex(
      (applied, index) => !claimed.has(index) && applied?.id === columnId && applied.value?.condition === condition
    );
    if (appliedIndex >= 0) claimed.add(appliedIndex);

    return [
      {
        id,
        columnId,
        column: column.header,
        condition,
        operator: FILTER_OPTIONS.find(({ value }) => value === condition)?.name ?? condition,
        needsValue: !NO_VALUE_CONDITIONS.includes(condition),
        placeholder: PICKED_COLUMN_TYPES.includes(column.columnType) ? 'Select' : 'value',
        columnType: column.columnType,
        applied: appliedIndex >= 0,
        appliedIndex,
        value: appliedIndex >= 0 ? (appliedFilters[appliedIndex].value.value ?? '') : '',
      },
    ];
  });
};
