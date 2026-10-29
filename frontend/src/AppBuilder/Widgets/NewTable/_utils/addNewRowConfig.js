const ADD_NEW_ROW_PLACEMENTS = ['table', 'dialog'];
const NON_ADDABLE_COLUMN_TYPES = ['button'];

export const resolveAddNewRowIn = (value) => (ADD_NEW_ROW_PLACEMENTS.includes(value) ? value : 'table');

// Same key the add-row draft is stored under (accessorKey in generateColumnsData).
export const getColumnKey = (column) => column.key || column.name;

// The table makes a column for every key inside an object in its data ("metadata.team", "metadata.level"). When
// the parent column ("metadata", e.g. a JSON column) exists it already holds those keys, so they are not offered
// again, and a "metadata.team" value would otherwise be written over what was typed in the "metadata" field.
// A table that only has the nested columns keeps them, as the only way to enter those values.
const hasParentColumn = (column, columnKeys) => {
  const parts = String(getColumnKey(column) ?? '').split('.');
  return parts.slice(1).some((_, index) => columnKeys.has(parts.slice(0, index + 1).join('.')));
};

export const getAddNewRowColumns = (columns, selectedKeys) => {
  const isSelected = Array.isArray(selectedKeys) ? (column) => selectedKeys.includes(getColumnKey(column)) : () => true;
  const columnKeys = new Set((columns ?? []).filter(Boolean).map(getColumnKey));

  return (columns ?? []).filter(
    (column) =>
      column &&
      !NON_ADDABLE_COLUMN_TYPES.includes(column.columnType) &&
      !hasParentColumn(column, columnKeys) &&
      isSelected(column)
  );
};

// The table's own columns (not the Inspector's column settings): only the ones the form includes.
export const getIncludedTableColumns = (tableColumns, selectedKeys) => {
  const included = new Set(
    getAddNewRowColumns(
      (tableColumns ?? []).map((column) => ({
        key: column.columnDef?.accessorKey,
        columnType: column.columnDef?.meta?.columnType,
      })),
      selectedKeys
    ).map(getColumnKey)
  );
  return (tableColumns ?? []).filter((column) => included.has(column.columnDef?.accessorKey));
};

// Empty date input hint, taken from the column's own format: "DD/MM/YYYY" shows as "dd/mm/yyyy".
export const getDatePlaceholder = ({
  dateFormat,
  isTimeChecked = false,
  isDateSelectionEnabled = true,
  isTwentyFourHrFormatEnabled = false,
}) => {
  const date = String(dateFormat || 'DD/MM/YYYY').toLowerCase();
  const time = isTwentyFourHrFormatEnabled ? 'hh:mm' : 'hh:mm am';
  if (!isTimeChecked) return date;
  return isDateSelectionEnabled === false ? time : `${date} ${time}`;
};

// Options of a select-like column, as the table cell resolves them (static list or a dynamic binding).
export const getColumnSelectOptions = (column, resolve) => {
  if (resolve(column?.useDynamicOptions)) {
    const dynamicOptions = resolve(column?.dynamicOptions || []);
    return Array.isArray(dynamicOptions) ? dynamicOptions : [];
  }
  return (column?.options ?? []).map(({ label, value, optionColor, labelColor }) => ({
    label,
    value,
    optionColor,
    labelColor,
  }));
};

// Validation settings the table actually enforces, per column type (the same ones its cell validation reads).
const TEXT_VALIDATION = ['regex', 'minLength', 'maxLength', 'customRule'];
const VALIDATION_KEYS_BY_TYPE = {
  string: TEXT_VALIDATION,
  default: TEXT_VALIDATION,
  text: TEXT_VALIDATION,
  number: ['minValue', 'maxValue', 'customRule'],
  select: ['customRule'],
  dropdown: ['customRule'],
  newMultiSelect: ['customRule'],
  tagsV2: ['customRule'],
  datepicker: ['minDate', 'maxDate', 'minTime', 'maxTime', 'customRule'],
};

// True when the column has a rule set (a min, a max, a regex or a custom rule). Such fields get a * in the form.
export const hasColumnValidation = (column) => {
  if (!column) return false;
  const keys = VALIDATION_KEYS_BY_TYPE[column.columnType ?? 'string'] ?? [];
  return keys.some((key) => column[key] !== undefined && column[key] !== null && String(column[key]).trim() !== '');
};
