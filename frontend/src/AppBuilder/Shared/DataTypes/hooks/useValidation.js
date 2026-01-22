import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

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
  const validateWidget = useStore((state) => state.validateWidget, shallow);

  return validateWidget({
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
  const validateWidget = useStore((state) => state.validateWidget, shallow);

  return validateWidget({
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
