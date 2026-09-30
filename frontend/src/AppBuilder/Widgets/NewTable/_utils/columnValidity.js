import useStore from '@/AppBuilder/_stores/store';

// Mirrors the validation each column adapter already runs on its own cell render
// (StringColumnAdapter, TextColumnAdapter, NumberColumnAdapter, SelectColumnAdapter,
// TagsV2ColumnAdapter, Datepicker) so store-level aggregation (isValid) agrees with
// the per-cell .is-invalid state the same adapters already show. Column types with
// no validation config (boolean, button, html, image, json, link, markdown) are
// always valid here, same as their adapters never computing isValid at all.
const STRING_LIKE_TYPES = new Set(['string', 'default', 'text']);
const CUSTOM_RULE_ONLY_TYPES = new Set(['select', 'newMultiSelect', 'tagsV2']);

export function isCellValueValid(column, value) {
  if (!column) return true;
  const { columnType } = column;
  const { validateWidget, validateDates } = useStore.getState();

  if (STRING_LIKE_TYPES.has(columnType)) {
    return validateWidget({
      validationObject: {
        regex: { value: column.regex },
        minLength: { value: column.minLength },
        maxLength: { value: column.maxLength },
        customRule: { value: column.customRule },
      },
      widgetValue: value,
      customResolveObjects: { cellValue: value },
    }).isValid;
  }

  if (columnType === 'number') {
    return validateWidget({
      validationObject: {
        minValue: { value: column.minValue },
        maxValue: { value: column.maxValue },
        regex: { value: column.regex },
        customRule: { value: column.customRule },
      },
      widgetValue: value,
      customResolveObjects: { cellValue: value },
    }).isValid;
  }

  if (CUSTOM_RULE_ONLY_TYPES.has(columnType)) {
    return validateWidget({
      validationObject: { customRule: { value: column.customRule } },
      widgetValue: value,
      customResolveObjects: { value },
    }).isValid;
  }

  if (columnType === 'datepicker') {
    return validateDates({
      validationObject: {
        minDate: { value: column.minDate },
        maxDate: { value: column.maxDate },
        minTime: { value: column.minTime },
        maxTime: { value: column.maxTime },
        parseDateFormat: { value: column.parseDateFormat },
        customRule: { value: column.customRule },
      },
      widgetValue: value,
      customResolveObjects: { cellValue: value },
    }).isValid;
  }

  return true;
}

function buildColumnsByKey(columnProperties) {
  const columnsByKey = {};
  (columnProperties || []).forEach((column) => {
    const key = column.key || column.name;
    if (key) columnsByKey[key] = column;
  });
  return columnsByKey;
}

// rowsMap: Map<rowIndex, { [fieldKey]: value }> - either the changeSet's editedFields
// (only edited fields per row) or the add-new-row draft's fields (every column's
// current value per draft row). Either shape is valid: only keys present in the
// map are looked up against columnsByKey and validated.
export function isEditedFieldsMapValid(rowsMap, columnProperties) {
  if (!rowsMap) return true;
  const columnsByKey = buildColumnsByKey(columnProperties);
  for (const fields of rowsMap.values()) {
    for (const [key, value] of Object.entries(fields ?? {})) {
      if (!isCellValueValid(columnsByKey[key], value)) return false;
    }
  }
  return true;
}
