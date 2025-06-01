import React from 'react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { DATATYPE_TO_COMPONENT } from '../constants';
import { startCase } from 'lodash';

/**
 * Builds options array for dropdown, multiselect, and radio button components
 * @param {Array} options - Array of string values to convert to option objects
 * @returns {Array} Array of option objects with label, value, and state properties
 */
export const buildOptions = (options) =>
  options.map((option, index) => ({
    label: option,
    value: `${index + 1}`,
    disable: { value: false },
    visible: { value: true },
    default: { value: false },
  }));

/**
 * Ensures a value is wrapped in handlebars if it's not already
 * @param {*} value - The value to wrap in handlebars
 * @returns {string} Value properly wrapped in handlebars
 */
export const ensureHandlebars = (value) => {
  if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
    return value; // Already has handlebars
  }
  return `{{${value}}}`;
};

// Helper function to check if a value is considered "true"
export const isTrueValue = (value) => {
  if (value === true) return true;
  if (typeof value === 'string') {
    const trimmedValue = value.trim().toLowerCase();
    // Check for "{{true}}" format or just "true"
    return trimmedValue === '{{true}}' || trimmedValue === 'true';
  }
  return false;
};

/**
 * Checks if a property has fx active and should be disabled for direct editing
 * @param {Object} property - The property to check
 * @returns {boolean} - Whether the property is controlled by fx
 */
export const isPropertyFxControlled = (property) => {
  return property && typeof property === 'object' && property.fxActive === true;
};

export const isValidJSONObject = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch (e) {
    return false;
  }
};

export const getDataType = (value) => {
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return 'date';
    return 'string';
  }
  if (typeof value === 'object' && value !== null) return 'object';
  return typeof value;
};

export const buildFieldObject = (key, value, label, jsonDifferences) => {
  const dataType = getDataType(value);
  return {
    key,
    name: key,
    label: startCase(label) || startCase(key),
    value: dataType === 'number' || dataType === 'boolean' ? ensureHandlebars(value) : value,
    dataType,
    componentType: DATATYPE_TO_COMPONENT[dataType] || 'TextInput',
    mandatory: { value: false },
    selected: { value: false },
    isCustomField: false,
    isNew: jsonDifferences.isNew.includes(key),
    isRemoved: jsonDifferences.isRemoved.includes(key),
    isExisting: jsonDifferences.isExisting.includes(key),
  };
};

/**
 * Parse data and build the fields for form generation
 * @param {Object} data - The input data to parse
 * @returns {Array} Parsed data in expected format
 */
export const parseDataAndBuildFields = (data, jsonDifferences = []) => {
  const obj = data || {};
  const result = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = Object.keys(value);
      if (nestedKeys.length === 0) {
        // Skip empty objects
        return;
      }

      // One-level deep: process children
      nestedKeys.forEach((nestedKey) => {
        const nestedValue = value[nestedKey];
        if (
          typeof nestedValue === 'object' &&
          nestedValue !== null &&
          !Array.isArray(nestedValue) &&
          Object.keys(nestedValue).length === 0
        ) {
          // Skip nested empty objects
          return;
        }

        result.push(buildFieldObject(`${key}.${nestedKey}`, nestedValue, nestedKey, jsonDifferences));
      });
    } else {
      result.push(buildFieldObject(key, value, key, jsonDifferences));
    }
  });

  return result;
};

/**
 * Find the last element's position in child components
 * @param {Object} childComponents - Object containing child components
 * @returns {Object} Position data including top, left, width, height
 */
export const findLastElementPosition = (childComponents, currentLayout = 'desktop') => {
  // Default position if no valid components found
  const defaultPosition = { top: 0, left: 0, width: 0, height: 0 };

  // Safety check - ensure childComponents is an object and not empty
  if (!childComponents || typeof childComponents !== 'object' || Object.keys(childComponents).length === 0) {
    return defaultPosition;
  }

  try {
    // Convert object to array of components
    const componentsArray = Object.values(childComponents);

    // Find component with highest top value (lowest on the screen)
    let highestTop = -1;
    let lastComponent = null;

    // Iterate through the components
    for (const component of componentsArray) {
      const currentTop = component?.component?.layouts?.[currentLayout]?.top || 0;

      if (currentTop > highestTop) {
        highestTop = currentTop;
        lastComponent = component;
      }
    }

    // If we found a valid component with layout data
    if (
      lastComponent &&
      lastComponent.component &&
      lastComponent.component.layouts &&
      lastComponent.component.layouts[currentLayout]
    ) {
      const { top = 0, left = 0, width = 0, height = 0 } = lastComponent.component.layouts[currentLayout];

      // Calculate next position (typically below the last element with some margin)
      return {
        top: top + height + 10, // Add some margin
        left,
        width,
        height,
      };
    }

    return defaultPosition;
  } catch (error) {
    console.error('Error finding last element position:', error);
    return defaultPosition;
  }
};

export const getInputTypeOptions = (darkMode) => {
  return {
    TextInput: {
      value: 'TextInput',
      leadingIcon: <WidgetIcon name={'textinput'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    NumberInput: {
      value: 'NumberInput',
      leadingIcon: <WidgetIcon name={'numberinput'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    PasswordInput: {
      value: 'PasswordInput',
      leadingIcon: <WidgetIcon name={'passwordinput'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    TextArea: {
      value: 'TextArea',
      leadingIcon: <WidgetIcon name={'textarea'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    DaterangePicker: {
      value: 'DaterangePicker',
      leadingIcon: <WidgetIcon name={'daterangepicker'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    DatePickerV2: {
      value: 'DatePickerV2',
      leadingIcon: <WidgetIcon name={'datepicker'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    Checkbox: {
      value: 'Checkbox',
      leadingIcon: <WidgetIcon name={'checkbox'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    DropdownV2: {
      value: 'DropdownV2',
      leadingIcon: <WidgetIcon name={'dropdown'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    MultiselectV2: {
      value: 'MultiselectV2',
      leadingIcon: <WidgetIcon name={'multiselect'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    RadioButtonV2: {
      value: 'RadioButtonV2',
      leadingIcon: <WidgetIcon name={'radiobutton'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
    ToggleSwitchV2: {
      value: 'ToggleSwitchV2',
      leadingIcon: <WidgetIcon name={'toggleswitch'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />,
    },
  };
};

export const constructFeildForSave = (field) => {
  const { key, value, dataType, componentType, mandatory, selected, isCustomField } = field;

  return {
    key,
    value: dataType === 'number' || dataType === 'boolean' ? ensureHandlebars(value) : value,
    dataType,
    componentType,
    mandatory: mandatory?.value || false,
    selected: selected?.value || false,
    isCustomField: isCustomField || false,
  };
};

/**
 * Recursively extracts all keys from a nested JSON object
 * @param {Object} json - The JSON object to extract keys from
 * @param {String} parentKey - Parent key for nested objects
 * @returns {Array} Array of keys with dot notation for nested keys
 */
const extractKeys = (json, parentKey = '') => {
  if (!json || typeof json !== 'object') return [];

  return Object.keys(json).reduce((keys, key) => {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;
    const value = json[key];

    // If value is object and not null, extract nested keys
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return [...keys, currentKey, ...extractKeys(value, currentKey)];
    }

    return [...keys, currentKey];
  }, []);
};

/**
 * Analyzes key differences between two JSON objects
 * @param {Object} newJson - The new JSON object
 * @param {Object} existingJson - The existing JSON object
 * @returns {Object} Object containing arrays of keys categorized by status
 */
export const analyzeJsonDifferences = (newJson, existingJson) => {
  if (!newJson || !existingJson) {
    return {
      isExisting: [],
      isNew: [],
      isRemoved: [],
    };
  }

  const newKeys = extractKeys(newJson);
  const existingKeys = extractKeys(existingJson);

  return {
    // Keys that exist in both objects
    isExisting: newKeys.filter((key) => existingKeys.includes(key)),
    // Keys that only exist in new object
    isNew: newKeys.filter((key) => !existingKeys.includes(key)),
    // Keys that only exist in old object (removed)
    isRemoved: existingKeys.filter((key) => !newKeys.includes(key)),
  };
};
