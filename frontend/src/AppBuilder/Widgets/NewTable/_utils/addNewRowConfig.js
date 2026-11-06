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

// A saved list that matches none of the table's columns (an empty list, or keys of columns since deleted or
// renamed) is treated as "every column", so the form never opens with nothing to fill in.
export const getAddNewRowColumns = (columns, selectedKeys) => {
  const columnKeys = new Set((columns ?? []).filter(Boolean).map(getColumnKey));
  const addable = (columns ?? []).filter(
    (column) => column && !NON_ADDABLE_COLUMN_TYPES.includes(column.columnType) && !hasParentColumn(column, columnKeys)
  );
  if (!Array.isArray(selectedKeys)) return addable;

  const selected = addable.filter((column) => selectedKeys.includes(getColumnKey(column)));
  return selected.length > 0 ? selected : addable;
};

// The columns every added row carries a key for, as the popup always sent them: all of the table's columns (an
// unticked one goes out empty), except the selection and expansion columns and nested columns whose parent
// column holds them. Which of these the form shows is getAddNewRowColumns' job.
export const getNewRowPayloadColumns = (tableColumns) => {
  const columns = (tableColumns ?? []).filter((column) => !column.columnDef?.meta?.skipAddNewRow);
  const columnKeys = new Set(columns.map((column) => column.columnDef?.accessorKey));
  return columns.filter((column) => !hasParentColumn({ key: column.columnDef?.accessorKey }, columnKeys));
};

// What a select-like field stores, as the table cell it replaces did: a multiselect holds the chosen option
// objects, tags hold { label, value } (an array when several are allowed), a single select holds the bare value.
// `picked` is the bare value, or the array of bare values, that the form control works with.
export const toNewRowSelectValue = ({ columnType, allowMultiple = false, options = [] }, picked) => {
  const optionOf = (value) => options.find((option) => option.value === value);
  if (columnType === 'newMultiSelect') {
    return (picked ?? []).map((value) => optionOf(value) ?? { label: value, value });
  }
  if (columnType === 'tagsV2') {
    const tagOf = (value) => ({ label: String(optionOf(value)?.label ?? value), value: String(value) });
    if (allowMultiple) return (picked ?? []).map(tagOf);
    return picked === undefined || picked === null || picked === '' ? [] : tagOf(picked);
  }
  return picked;
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
