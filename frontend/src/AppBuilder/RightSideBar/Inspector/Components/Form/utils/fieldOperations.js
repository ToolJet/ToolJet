import { merge, set } from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { v4 as uuidv4 } from 'uuid';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { ensureHandlebars, buildOptions } from './utils';

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
    const componentName = useStore.getState().generateUniqueComponentName(column.name);

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

    setValuesBasedOnType(column, componentType, formField);

    // Set default value if available in column
    // if (column.value !== undefined && column.value !== null && !column.isCustomField) {
    //   if (componentType === 'TextInput' || componentType === 'PasswordInput' || componentType === 'TextArea') {
    //     set(formField.component.definition.properties, 'value.value', column.value);
    //   }
    //   if (componentType === 'NumberInput') {
    //     set(formField.component.definition.properties, 'value.value', ensureHandlebars(column.value));
    //   } else if (
    //     componentType === 'Checkbox' ||
    //     componentType === 'DatePickerV2' ||
    //     componentType === 'ToggleSwitchV2'
    //   ) {
    //     set(formField.component.definition.properties, 'defaultValue.value', column.value);
    //   } else if (
    //     componentType === 'DropdownV2' ||
    //     componentType === 'MultiselectV2' ||
    //     componentType === 'RadioButtonV2'
    //   ) {
    //     set(formField.component.definition.properties, 'options.value', buildOptions(column.value));
    //   }
    // }

    // if (
    //   column.placeholder &&
    //   componentType !== 'Checkbox' &&
    //   componentType !== 'DatePickerV2' &&
    //   componentType !== 'ToggleSwitchV2' &&
    //   componentType !== 'DaterangePicker'
    // ) {
    //   set(formField.component.definition.properties, 'placeholder.value', column.placeholder);
    // }

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

  return { updatedColumns: columns, updatedFormFields: formFieldComponents };
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

  setValuesBasedOnType(updatedField, componentType, updatedComponent);

  // if (updatedField.value !== undefined && updatedField.value !== null) {
  //   if (componentType === 'TextInput' || componentType === 'PasswordInput' || componentType === 'TextArea') {
  //     set(updatedComponent.component.definition.properties, 'value.value', updatedField.value);
  //   } else if (componentType === 'NumberInput') {
  //     set(updatedComponent.component.definition.properties, 'value.value', ensureHandlebars(updatedField.value));
  //   } else if (componentType === 'Checkbox' || componentType === 'DatePickerV2' || componentType === 'ToggleSwitchV2') {
  //     set(updatedComponent.component.definition.properties, 'defaultValue.value', updatedField.value);
  //   } else if (
  //     componentType === 'DropdownV2' ||
  //     componentType === 'MultiselectV2' ||
  //     componentType === 'RadioButtonV2'
  //   ) {
  //     // Handle options update if provided
  //     if (Array.isArray(updatedField.value)) {
  //       set(updatedComponent.component.definition.properties, 'options.value', buildOptions(updatedField.value));
  //     }
  //   }
  // }

  // // Update placeholder if available and applicable to the component type
  // if (
  //   updatedField.placeholder &&
  //   componentType !== 'Checkbox' &&
  //   componentType !== 'DatePickerV2' &&
  //   componentType !== 'ToggleSwitchV2' &&
  //   componentType !== 'DaterangePicker'
  // ) {
  //   set(updatedComponent.component.definition.properties, 'placeholder.value', updatedField.placeholder);
  // }

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
  const componentName = useStore
    .getState()
    .generateUniqueComponentName(updatedField.name || componentToUpdate.component.name);

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

  setValuesBasedOnType(updatedField, updatedField.componentType, newComponent);

  // Handle component-specific properties
  // if (updatedField.value !== undefined && updatedField.value !== null) {
  //   if (
  //     updatedField.componentType === 'TextInput' ||
  //     updatedField.componentType === 'PasswordInput' ||
  //     updatedField.componentType === 'TextArea'
  //   ) {
  //     set(newComponent.component.definition.properties, 'value.value', updatedField.value);
  //   } else if (updatedField.componentType === 'NumberInput') {
  //     set(newComponent.component.definition.properties, 'value.value', ensureHandlebars(updatedField.value));
  //   } else if (
  //     updatedField.componentType === 'Checkbox' ||
  //     updatedField.componentType === 'DatePickerV2' ||
  //     updatedField.componentType === 'ToggleSwitchV2 '
  //   ) {
  //     set(newComponent.component.definition.properties, 'defaultValue.value', updatedField.value);
  //   } else if (
  //     updatedField.componentType === 'DropdownV2' ||
  //     updatedField.componentType === 'MultiselectV2' ||
  //     updatedField.componentType === 'RadioButtonV2'
  //   ) {
  //     // For dropdown-type components, ensure we have options array
  //     const optionsArray = Array.isArray(updatedField.value)
  //       ? updatedField.value
  //       : typeof updatedField.value === 'string'
  //       ? [updatedField.value]
  //       : ['Option 1'];

  //     set(newComponent.component.definition.properties, 'options.value', buildOptions(optionsArray));
  //   }
  // }

  // // Update placeholder if available and applicable to the component type
  // if (
  //   updatedField.placeholder &&
  //   updatedField.componentType !== 'Checkbox' &&
  //   updatedField.componentType !== 'DatePickerV2' &&
  //   updatedField.componentType !== 'ToggleSwitchV2' &&
  //   updatedField.componentType !== 'DaterangePicker'
  // ) {
  //   set(newComponent.component.definition.properties, 'placeholder.value', updatedField.placeholder);
  // }

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

const setValuesBasedOnType = (column, componentType, formField) => {
  if (column.value !== undefined && column.value !== null) {
    if (componentType === 'TextInput' || componentType === 'PasswordInput' || componentType === 'TextArea') {
      set(formField.component.definition.properties, 'value.value', column.value);
    }
    if (componentType === 'NumberInput') {
      set(formField.component.definition.properties, 'value.value', ensureHandlebars(column.value));
    } else if (componentType === 'Checkbox' || componentType === 'DatePickerV2' || componentType === 'ToggleSwitchV2') {
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
};

/**
 * Retrieves field data from a component definition in the store
 * @param {string} componentId - Component ID to fetch definition for
 * @param {Function} getComponentDefinition - Function to get component definition
 * @returns {Object} Field data with merged component definition values
 */
export const getFieldDataFromComponent = (componentId, getComponentDefinition) => {
  if (!componentId) {
    return null;
  }

  const component = getComponentDefinition(componentId);
  if (!component) return null;

  const componentType = component.component.component;
  const definition = component.component.definition;

  // Get values from component definition
  const label = definition.properties?.label?.value || '';
  const name = component.component.name;

  // Different components store values in different properties
  let value;
  if (componentType === 'Checkbox' || componentType === 'DatePickerV2') {
    value = definition.properties?.defaultValue?.value;
  } else {
    value = definition.properties?.value?.value;
  }

  const mandatory = definition.validation?.mandatory;
  const selected = definition.properties?.visibility;
  const placeholder = definition.properties?.placeholder?.value || '';

  return {
    label,
    name,
    value,
    mandatory,
    selected,
    placeholder,
    componentType,
  };
};
