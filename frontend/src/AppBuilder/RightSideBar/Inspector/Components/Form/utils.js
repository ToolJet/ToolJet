import React from 'react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { DATATYPE_TO_COMPONENT } from './constants';
import { startCase, merge, set } from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { v4 as uuidv4 } from 'uuid';
import { componentTypes } from '@/AppBuilder/WidgetManager';

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

/**
 * Parse data for form generation
 * @param {Object} data - The input data to parse
 * @returns {Array} Parsed data in expected format
 */
export const parseData = (data) => {
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

        const dataType = getDataType(nestedValue);

        result.push({
          key: `${key}.${nestedKey}`,
          name: `${key}.${nestedKey}`,
          label: startCase(nestedKey),
          value: nestedValue,
          dataType: dataType,
          componentType: DATATYPE_TO_COMPONENT[dataType] || 'TextInput',
          mandatory: false,
          selected: false,
        });
      });
    } else {
      const dataType = getDataType(value);
      result.push({
        key,
        name: key,
        label: startCase(key),
        value,
        dataType: dataType,
        componentType: DATATYPE_TO_COMPONENT[dataType] || 'TextInput',
        mandatory: false,
        selected: false,
      });
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
  };
};

/**
 * Creates form field components from selected columns
 * @param {Array} columns - Array of columns selected for form generation
 * @param {string} parentId - ID of the parent Form component
 * @param {string} currentLayout - Current layout (desktop or mobile)
 * @param {Object} lastPosition - Position data for placement of components
 * @returns {Array} Array of form field components
 */
export const createFormFieldComponents = (columns, parentId, currentLayout, lastPosition) => {
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return [];
  }

  const formFieldComponents = [];
  const fieldSpacing = 10; // Space between fields

  // Initialize position from lastPosition
  let currentTop = lastPosition?.top || 0;
  const left = lastPosition?.left || 0;
  const width = lastPosition?.width || 12;

  columns.forEach((column, index) => {
    const componentType = column.componentType || 'TextInput';
    const fieldId = uuidv4();
    const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';

    // Get component metadata to access default values and properties
    const componentMeta = componentTypes.find((comp) => comp.component === componentType);

    if (!componentMeta) {
      console.error(`Component type ${componentType} not found in componentTypes`);
      return;
    }

    // Get the default height from component metadata
    const defaultHeight = componentMeta.defaultSize?.height || 30;

    // Calculate position for the current field
    // First field should be at lastPosition.top, subsequent fields below the previous one
    const fieldTop = index === 0 ? currentTop : currentTop + fieldSpacing;

    // Create a deep clone of the component definition to avoid reference issues
    const componentData = deepClone(componentMeta);

    // Initialize the form field with default component properties
    const formField = {
      id: fieldId,
      name: column.name,
      component: {
        ...componentData,
        component: componentType,
        name: column.name,
        parent: parentId,
        definition: merge({}, componentData.definition, {
          properties: {
            label: {
              value: column.label,
            },
            isMandatory: {
              value: `{{${column.mandatory || false}}}`,
            },
            visibility: {
              value: `{{${column.selected || false}}}`,
            },
          },
          others: {
            showOnDesktop: {
              value: currentLayout === 'desktop' ? '{{true}}' : '{{false}}',
            },
            showOnMobile: {
              value: currentLayout === 'mobile' ? '{{true}}' : '{{false}}',
            },
          },
        }),
      },
      layouts: {
        [currentLayout]: {
          top: fieldTop,
          left: left,
          width: width,
          height: defaultHeight,
        },
        [nonActiveLayout]: {
          top: fieldTop,
          left: left,
          width: width,
          height: defaultHeight,
        },
      },
    };

    // Set default value if available in column

    if (column.value !== undefined && column.value !== null) {
      if (componentType === 'TextInput' || componentType === 'NumberInput') {
        set(formField.component.definition.properties, 'value.value', column.value);
      } else if (componentType === 'Checkbox' || componentType === 'DatePickerV2') {
        set(formField.component.definition.properties, 'checked.value', column.value);
      }
    }

    // // Additional component-specific configurations based on data type
    // if (column.dataType === 'array' && formField.component.component === 'DropdownV2') {
    //   // Handle array values for dropdown
    //   set(
    //     formField.component.definition.properties,
    //     'options.value',
    //     Array.isArray(column.value) ? JSON.stringify(column.value) : '{{["Option 1", "Option 2", "Option 3"]}}'
    //   );
    // }

    // Update the current top position for the next field
    currentTop = fieldTop + defaultHeight;

    formFieldComponents.push(formField);
  });

  return formFieldComponents;
};
