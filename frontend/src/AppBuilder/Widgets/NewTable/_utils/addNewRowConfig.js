const ADD_NEW_ROW_PLACEMENTS = ['table', 'dialog'];
const NON_ADDABLE_COLUMN_TYPES = ['button'];

export const resolveAddNewRowIn = (value) => (ADD_NEW_ROW_PLACEMENTS.includes(value) ? value : 'table');

// Same key the add-row draft is stored under (accessorKey in generateColumnsData).
export const getColumnKey = (column) => column.key || column.name;

export const getAddNewRowColumns = (columns, selectedKeys) => {
  const isSelected = Array.isArray(selectedKeys) ? (column) => selectedKeys.includes(getColumnKey(column)) : () => true;

  return (columns ?? []).filter(
    (column) => column && !NON_ADDABLE_COLUMN_TYPES.includes(column.columnType) && isSelected(column)
  );
};
