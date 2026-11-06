// Columns whose filter value is one of the column's options, and the operators that can take several of them
const OPTION_COLUMN_TYPES = ['select', 'newMultiSelect', 'tagsV2'];
const MULTI_CONDITIONS = ['contains', 'doesNotContains'];

export const isMultiPick = (columnType, condition) =>
  OPTION_COLUMN_TYPES.includes(columnType) && MULTI_CONDITIONS.includes(condition);

// A saved value as the options picked: a single value (an old filter, a builder default) is a list of one
export const toValueList = (value) => {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null || value === '' ? [] : [value];
};

// Nothing typed or picked: no text, or a list with nothing in it
export const isBlankValue = (value) => value === '' || (Array.isArray(value) && value.length === 0);
