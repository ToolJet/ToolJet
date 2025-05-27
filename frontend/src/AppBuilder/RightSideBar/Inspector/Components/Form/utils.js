import React from 'react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { DATATYPE_TO_COMPONENT } from './constants';
import { startCase, merge, set } from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { v4 as uuidv4 } from 'uuid';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

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
          value: dataType === 'number' || dataType === 'boolean' ? ensureHandlebars(nestedValue) : nestedValue,
          dataType: dataType,
          componentType: DATATYPE_TO_COMPONENT[dataType] || 'TextInput',
          mandatory: { value: false },
          selected: { value: false },
          isCustomField: false,
        });
      });
    } else {
      const dataType = getDataType(value);
      result.push({
        key,
        name: key,
        label: startCase(key),
        value: dataType === 'number' || dataType === 'boolean' ? ensureHandlebars(value) : value,
        dataType: dataType,
        componentType: DATATYPE_TO_COMPONENT[dataType] || 'TextInput',
        mandatory: { value: false },
        selected: { value: false },
        isCustomField: false,
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
    return { updatedColumns: [], formFields: [] };
  }

  const formFieldComponents = [];
  const fieldSpacing = 10; // Space between fields

  // Initialize position from lastPosition
  let currentTop = lastPosition?.top || 0;
  const left = 3;
  const width = 37;

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
    const componentName = generateUniqueComponentName(column.name);

    // Initialize the form field with default component properties
    const formField = {
      id: fieldId,
      name: componentName,
      component: {
        ...componentData,
        component: componentType,
        name: componentName,
        parent: parentId,
        definition: merge({}, componentData.definition, {
          properties: {
            label: {
              value: column.label,
            },
            visibility: column.selected,
          },
          validation: {
            mandatory: column.mandatory,
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
    if (column.value !== undefined && column.value !== null && !column.isCustomField) {
      if (componentType === 'TextInput' || componentType === 'PasswordInput' || componentType === 'TextArea') {
        set(formField.component.definition.properties, 'value.value', column.value);
      }
      if (componentType === 'NumberInput') {
        set(formField.component.definition.properties, 'value.value', ensureHandlebars(column.value));
      } else if (
        componentType === 'Checkbox' ||
        componentType === 'DatePickerV2' ||
        componentType === 'ToggleSwitchV2'
      ) {
        set(formField.component.definition.properties, 'defaultValue.value', column.value);
      } else if (
        componentType === 'DropdownV2' ||
        componentType === 'MultiselectV2' ||
        componentType === 'RadioButtonV2'
      ) {
        set(formField.component.definition.properties, 'options.value', buildOptions(column.value));
      }
    }

    if (
      column.placeholder &&
      componentType !== 'Checkbox' &&
      componentType !== 'DatePickerV2' &&
      componentType !== 'ToggleSwitchV2' &&
      componentType !== 'DaterangePicker'
    ) {
      set(formField.component.definition.properties, 'placeholder.value', column.placeholder);
    }

    // Update the current top position for the next field
    currentTop = fieldTop + defaultHeight;

    formFieldComponents.push(formField);

    // Create simplified column structure with only the required fields
    // This will allow DataSectionUI to use componentId to fetch detailed info from the store
    const simplifiedColumn = {
      componentId: fieldId,
      isCustomField: column.isCustomField ?? false,
      dataType: column.dataType,
      key: column.key || column.name,
    };

    columns[index] = simplifiedColumn; // Replace with simplified structure
  });

  return { updatedColumns: columns, formFields: formFieldComponents };
};

/**
 * Builds options array for dropdown, multiselect, and radio button components
 * @param {Array} options - Array of string values to convert to option objects
 * @returns {Array} Array of option objects with label, value, and state properties
 */
const buildOptions = (options) =>
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

/**
 * Generates a unique component name by checking if it already exists
 * @param {string} baseName - The base name for the component
 * @returns {string} Unique component name
 */
export const generateUniqueComponentName = (baseName) => {
  const existingComponents = useStore.getState().getCurrentPageComponents();
  if (!existingComponents || typeof existingComponents !== 'object') {
    return baseName;
  }

  // Check if the base name is already available
  if (!Object.values(existingComponents).some((component) => component.component.name === baseName)) {
    return baseName;
  }

  // If base name exists, try adding numeric suffix
  let counter = 1;
  let newName = `${baseName}${counter}`;

  // Keep incrementing counter until we find an available name
  while (Object.values(existingComponents).some((component) => component.name === newName)) {
    counter++;
    newName = `${baseName}${counter}`;
  }

  return newName;
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

/**
 * Updates an existing form field component with new values
 * @param {string} componentId - ID of the component to update
 * @param {Object} updatedField - New field values to apply
 * @param {Object} currentField - Current field data
 * @returns {Object} Updated component definition
 */
export const updateFormFieldComponent = (componentId, updatedField, currentField) => {
  // Get the current component from the store
  const componentToUpdate = useStore.getState().getComponentDefinition(componentId);

  if (!componentToUpdate) {
    console.error(`Component with ID ${componentId} not found`);
    return null;
  }

  if (updatedField.componentType !== componentToUpdate.component.component) {
    return handleComponentTypeChange(componentToUpdate, updatedField, componentId);
  }

  // Create a deep clone of the component to avoid reference issues
  const updatedComponent = deepClone(componentToUpdate);

  // Update label if changed
  if (updatedField.label !== currentField.label) {
    set(updatedComponent.component.definition.properties, 'label.value', updatedField.label);
  }

  // Update mandatory status
  if (updatedField.mandatory !== currentField.mandatory) {
    set(updatedComponent.component.definition.validation, 'mandatory', updatedField.mandatory);
  }

  // Update visibility if changed
  if (updatedField.selected !== currentField.selected) {
    set(updatedComponent.component.definition.properties, 'visibility', updatedField.selected);
  }

  // Update component type specific properties
  const componentType = updatedField.componentType || componentToUpdate.component.component;

  if (updatedField.value !== undefined && updatedField.value !== null) {
    if (componentType === 'TextInput' || componentType === 'PasswordInput' || componentType === 'TextArea') {
      set(updatedComponent.component.definition.properties, 'value.value', updatedField.value);
    } else if (componentType === 'NumberInput') {
      set(updatedComponent.component.definition.properties, 'value.value', ensureHandlebars(updatedField.value));
    } else if (componentType === 'Checkbox' || componentType === 'DatePickerV2' || componentType === 'ToggleSwitchV2') {
      set(updatedComponent.component.definition.properties, 'defaultValue.value', updatedField.value);
    } else if (
      componentType === 'DropdownV2' ||
      componentType === 'MultiselectV2' ||
      componentType === 'RadioButtonV2'
    ) {
      // Handle options update if provided
      if (Array.isArray(updatedField.value)) {
        set(updatedComponent.component.definition.properties, 'options.value', buildOptions(updatedField.value));
      }
    }
  }

  // Update placeholder if available and applicable to the component type
  if (
    updatedField.placeholder &&
    componentType !== 'Checkbox' &&
    componentType !== 'DatePickerV2' &&
    componentType !== 'ToggleSwitchV2' &&
    componentType !== 'DaterangePicker'
  ) {
    set(updatedComponent.component.definition.properties, 'placeholder.value', updatedField.placeholder);
  }

  // return updatedComponent;
  return { updated: diff(componentToUpdate, updatedComponent) };
};

const handleComponentTypeChange = (componentToUpdate, updatedField, componentId) => {
  // Generate a new ID for the component
  const newComponentId = uuidv4();

  // Get the current layout
  const currentLayout = useStore.getState().currentLayout;
  const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';

  // Get component metadata for the new type
  const componentMeta = componentTypes.find((comp) => comp.component === updatedField.componentType);

  if (!componentMeta) {
    console.error(`Component type ${updatedField.componentType} not found in componentTypes`);
    return null;
  }

  // Extract existing layout information
  const existingLayouts = componentToUpdate.layouts || {};

  // Preserve the component name or generate a new one if needed
  const componentName = generateUniqueComponentName(updatedField.name || componentToUpdate.component.name);

  // Create a deep clone of the component definition to avoid reference issues
  const componentData = deepClone(componentMeta);

  // Initialize the new form field with preserved properties from the old one
  const newComponent = {
    id: newComponentId,
    name: componentName,
    component: {
      ...componentData,
      component: updatedField.componentType,
      name: componentName,
      parent: componentToUpdate.component.parent,
      definition: merge({}, componentData.definition, {
        properties: {
          label: {
            value: updatedField.label || componentToUpdate.component.definition.properties.label?.value,
          },
          visibility: updatedField.selected || componentToUpdate.component.definition.properties.visibility,
        },
        validation: {
          mandatory: updatedField.mandatory || componentToUpdate.component.definition.validation.mandatory,
        },
        others: {
          showOnDesktop: componentToUpdate.component.definition.others?.showOnDesktop || { value: '{{true}}' },
          showOnMobile: componentToUpdate.component.definition.others?.showOnMobile || { value: '{{false}}' },
        },
      }),
    },
    layouts: {
      [currentLayout]: existingLayouts[currentLayout] || { top: 0, left: 3, width: 37, height: 30 },
      [nonActiveLayout]: existingLayouts[nonActiveLayout] || { top: 0, left: 3, width: 37, height: 30 },
    },
  };

  // Handle component-specific properties
  if (updatedField.value !== undefined && updatedField.value !== null) {
    if (
      updatedField.componentType === 'TextInput' ||
      updatedField.componentType === 'PasswordInput' ||
      updatedField.componentType === 'TextArea'
    ) {
      set(newComponent.component.definition.properties, 'value.value', updatedField.value);
    } else if (updatedField.componentType === 'NumberInput') {
      set(newComponent.component.definition.properties, 'value.value', ensureHandlebars(updatedField.value));
    } else if (
      updatedField.componentType === 'Checkbox' ||
      updatedField.componentType === 'DatePickerV2' ||
      updatedField.componentType === 'ToggleSwitchV2 '
    ) {
      set(newComponent.component.definition.properties, 'defaultValue.value', updatedField.value);
    } else if (
      updatedField.componentType === 'DropdownV2' ||
      updatedField.componentType === 'MultiselectV2' ||
      updatedField.componentType === 'RadioButtonV2'
    ) {
      // For dropdown-type components, ensure we have options array
      const optionsArray = Array.isArray(updatedField.value)
        ? updatedField.value
        : typeof updatedField.value === 'string'
        ? [updatedField.value]
        : ['Option 1'];

      set(newComponent.component.definition.properties, 'options.value', buildOptions(optionsArray));
    }
  }

  // Update placeholder if available and applicable to the component type
  if (
    updatedField.placeholder &&
    updatedField.componentType !== 'Checkbox' &&
    updatedField.componentType !== 'DatePickerV2' &&
    updatedField.componentType !== 'ToggleSwitchV2' &&
    updatedField.componentType !== 'DaterangePicker'
  ) {
    set(newComponent.component.definition.properties, 'placeholder.value', updatedField.placeholder);
  }

  // Update the updatedField with the new component ID
  updatedField.componentId = newComponentId;

  // Return an object that indicates to:
  // 1. Delete the old component
  // 2. Add the new component
  return {
    deleted: true,
    added: newComponent,
    updated: {},
  };
};
