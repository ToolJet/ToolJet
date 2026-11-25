import { hasColumnValidation } from './addNewRowConfig';

const VALID = { isValid: true, validationError: null };

// The JSON field stores an object or array once its text parses, so text still in the draft is not valid JSON.
const getJsonError = (value) => {
  if (value === undefined || value === null || typeof value === 'object') return null;
  const text = String(value).trim();
  if (text === '') return null;
  try {
    JSON.parse(text);
    return 'Invalid JSON: enter an object or array';
  } catch {
    if (text.startsWith('{') && !text.endsWith('}')) return 'Invalid JSON: missing closing }';
    if (text.startsWith('[') && !text.endsWith(']')) return 'Invalid JSON: missing closing ]';
    return 'Invalid JSON';
  }
};

// Runs a new-row field through the same checks the table runs on a cell (the store's validateWidget and
// validateDates, fed the same column settings), so the messages are the table's own. Only columns that have
// a rule set are checked, which are the ones that carry a * in the form (JSON fields are checked as well).
export const validateNewRowField = (column, value, { validateWidget, validateDates, moduleId }) => {
  // a JSON field is always checked, rules or not
  if (column?.columnType === 'json') {
    const validationError = getJsonError(value);
    return validationError ? { isValid: false, validationError } : VALID;
  }
  if (!hasColumnValidation(column)) return VALID;

  // an empty cell reads as '' in the table, so an unfilled field is validated as such
  const cellValue = value ?? '';
  const shared = { widgetValue: cellValue, customResolveObjects: { cellValue }, moduleId };
  const rule = (name) => ({ value: column[name] });

  switch (column.columnType ?? 'string') {
    case 'string':
    case 'default':
    case 'text':
      return validateWidget({
        ...shared,
        validationObject: {
          regex: rule('regex'),
          minLength: rule('minLength'),
          maxLength: rule('maxLength'),
          customRule: rule('customRule'),
        },
      });
    case 'number':
      return validateWidget({
        ...shared,
        validationObject: { minValue: rule('minValue'), maxValue: rule('maxValue'), customRule: rule('customRule') },
      });
    case 'select':
    case 'dropdown':
    case 'newMultiSelect':
    case 'tagsV2':
      return validateWidget({ ...shared, validationObject: { customRule: rule('customRule') } });
    case 'datepicker':
      return validateDates({
        ...shared,
        validationObject: {
          minDate: rule('minDate'),
          maxDate: rule('maxDate'),
          minTime: rule('minTime'),
          maxTime: rule('maxTime'),
          parseDateFormat: rule('parseDateFormat'),
          customRule: rule('customRule'),
        },
      });
    default:
      return VALID;
  }
};
