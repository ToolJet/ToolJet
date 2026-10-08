import useStore from '@/AppBuilder/_stores/store';

// Mirrors the validation each field adapter already runs on its own render
// (StringFieldAdapter, TextFieldAdapter, NumberFieldAdapter, SelectFieldAdapter,
// DatepickerFieldAdapter) so this aggregation agrees with the per-field inline
// error KeyValueRow already shows. Field types with no validation config
// (boolean, link, image, json, markdown, html) are always valid here, same as
// their adapters never computing isValid at all.
const STRING_LIKE_TYPES = new Set(['string', 'text']);
const CUSTOM_RULE_ONLY_TYPES = new Set(['select', 'newMultiSelect']);

export function isFieldValueValid(field, value) {
  if (!field) return true;
  const { fieldType } = field;
  const { validateWidget, validateDates } = useStore.getState();

  if (STRING_LIKE_TYPES.has(fieldType)) {
    return validateWidget({
      validationObject: {
        regex: { value: field.regex },
        minLength: { value: field.minLength },
        maxLength: { value: field.maxLength },
        customRule: { value: field.customRule },
      },
      widgetValue: value,
      customResolveObjects: { cellValue: value },
    }).isValid;
  }

  if (fieldType === 'number') {
    return validateWidget({
      validationObject: {
        minValue: { value: field.minValue },
        maxValue: { value: field.maxValue },
        customRule: { value: field.customRule },
      },
      widgetValue: value,
      customResolveObjects: { cellValue: value },
    }).isValid;
  }

  if (CUSTOM_RULE_ONLY_TYPES.has(fieldType)) {
    return validateWidget({
      validationObject: { customRule: { value: field.customRule } },
      widgetValue: value,
      customResolveObjects: { value },
    }).isValid;
  }

  if (fieldType === 'datepicker') {
    return validateDates({
      validationObject: {
        minDate: { value: field.minDate },
        maxDate: { value: field.maxDate },
        minTime: { value: field.minTime },
        maxTime: { value: field.maxTime },
        parseDateFormat: { value: field.parseDateFormat },
        customRule: { value: field.customRule },
      },
      widgetValue: value,
      customResolveObjects: { cellValue: value },
    }).isValid;
  }

  return true;
}

// editedData: { [fieldKey]: value } - the changeSet. Only keys actually present
// in editedData are looked up against fieldsByKey and validated.
export function isEditedDataValid(editedData, fields) {
  if (!editedData) return true;
  const fieldsByKey = {};
  (fields || []).forEach((f) => {
    if (f?.key) fieldsByKey[f.key] = f;
  });
  return Object.entries(editedData).every(([key, value]) => isFieldValueValid(fieldsByKey[key], value));
}
