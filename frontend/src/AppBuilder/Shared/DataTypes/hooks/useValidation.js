import useStore from '@/AppBuilder/_stores/store';

// What validateWidget returns when there is no rule to check: the same answer for every value, so a field or cell with
// no rules skips it (each check also builds a row-scoped resolver).
const VALID = Object.freeze({ isValid: true, validationError: null });
const isUnset = (rule) => rule === undefined || rule === null || rule === '';

/**
 * useStringValidation - Shared validation hook for string fields
 *
 * Validates string values against regex, minLength, maxLength, and custom rules.
 * Can be used by both Table and KeyValuePair adapters.
 *
 * @param {Object} config - Validation config (column or field object)
 * @param {string} config.regex - Regex pattern to validate against
 * @param {number} config.minLength - Minimum length
 * @param {number} config.maxLength - Maximum length
 * @param {string} config.customRule - Custom validation rule
 * @param {string} value - The value to validate
 * @returns {{ isValid: boolean, validationError: string }}
 */
export const useStringValidation = (config, value) => {
  if ([config?.regex, config?.minLength, config?.maxLength, config?.customRule].every(isUnset)) return VALID;
  return useStore.getState().validateWidget({
    validationObject: {
      regex: { value: config?.regex },
      minLength: { value: config?.minLength },
      maxLength: { value: config?.maxLength },
      customRule: { value: config?.customRule },
    },
    widgetValue: value,
    customResolveObjects: { cellValue: value },
  });
};

/**
 * useNumberValidation - Shared validation hook for number fields
 *
 * Validates number values against min, max, and custom rules.
 *
 * @param {Object} config - Validation config (column or field object)
 * @param {number} config.minValue - Minimum value
 * @param {number} config.maxValue - Maximum value
 * @param {string} config.customRule - Custom validation rule
 * @param {number} value - The value to validate
 * @returns {{ isValid: boolean, validationError: string }}
 */
export const useNumberValidation = (config, value) => {
  if ([config?.minValue, config?.maxValue, config?.customRule].every(isUnset)) return VALID;
  return useStore.getState().validateWidget({
    validationObject: {
      minValue: { value: config?.minValue },
      maxValue: { value: config?.maxValue },
      customRule: { value: config?.customRule },
    },
    widgetValue: value,
    customResolveObjects: { cellValue: value },
  });
};

/**
 * useTextValidation - Shared validation hook for multiline text fields
 *
 * Validates text values against regex, minLength, maxLength, and custom rules.
 * Same as string but named for clarity.
 *
 * @param {Object} config - Validation config (column or field object)
 * @param {string} value - The value to validate
 * @returns {{ isValid: boolean, validationError: string }}
 */
export const useTextValidation = useStringValidation;
