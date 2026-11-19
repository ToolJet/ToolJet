import type { DataTableColumn } from './types';

// One CSS grid template for the header and every row, built from each column's `meta.width`.
export const getGridTemplateColumns = <T>(columns: DataTableColumn<T>[]): string =>
  columns.map((column) => column.meta.width).join(' ');
