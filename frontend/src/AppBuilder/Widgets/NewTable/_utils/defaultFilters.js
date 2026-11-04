import { isFilterComplete } from '../_components/Header/_components/Filter/filterUtils';

/**
 * The builder's saved default filters (`{ id, column, condition, value }`, `column` being a column id) as
 * the column filters the table applies. Filters that are not complete, or whose column is gone, are left out.
 */
export function getDefaultColumnFilters(defaultFilters, columns) {
  if (!Array.isArray(defaultFilters)) return [];

  return defaultFilters
    .map(({ column, condition, value }) => {
      const tableColumn = columns.find((candidate) => candidate.id === column);
      return tableColumn && { id: tableColumn.id, value: { column: tableColumn.header, condition, value } };
    })
    .filter((filter) => filter && isFilterComplete(filter));
}
