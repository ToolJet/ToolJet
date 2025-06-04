import { merge, set } from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { v4 as uuidv4 } from 'uuid';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { ensureHandlebars, buildOptions } from './utils';
import { COMPONENT_LAYOUT_DETAILS } from '../constants';

export const createNewComponentFromMeta = (column, parentId, nextTop) => {
  const currentLayout = useStore.getState().currentLayout;
  const componentType = column.componentType || 'TextInput';
  const fieldId = uuidv4();

  // Get component metadata to access default values and properties
  const componentMeta = componentTypes.find((comp) => comp.component === componentType);

  if (!componentMeta) {
    console.error(`Component type ${componentType} not found in componentTypes`);
    return;
  }

  // Get the default height from component metadata
  const defaultHeight = componentMeta.defaultSize?.height || COMPONENT_LAYOUT_DETAILS.defaultHeight;

  // Create a deep clone of the component definition to avoid reference issues
  const componentData = deepClone(componentMeta);
  const componentName = useStore.getState().generateUniqueComponentName(column.name);

  // Initialize the form field with default component properties
  const formField = {
    id: fieldId,
    name: componentName,
    component: {
      ...componentData,
      type: componentType,
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
      desktop: {
        top: nextTop,
        left: COMPONENT_LAYOUT_DETAILS.defaultLeft,
        width: COMPONENT_LAYOUT_DETAILS.defaultWidth,
        height: defaultHeight,
      },
      mobile: {
        top: nextTop,
        left: COMPONENT_LAYOUT_DETAILS.defaultLeft,
        width: COMPONENT_LAYOUT_DETAILS.defaultWidth,
        height: defaultHeight,
      },
    },
  };

  setValuesBasedOnType(column, componentType, formField);

  return {
    deleted: false,
    added: formField,
    updated: {},
  };
};

/**
 * Updates an existing form field component with new values
 * @param {string} componentId - ID of the component to update
 * @param {Object} updatedField - New field values to apply
 * @param {Object} currentField - Current field data
 * @returns {Object} Updated component definition
 */
export const updateFormFieldComponent = (updatedField, currentField, parentId, nextTop = 0) => {
  const componentId = updatedField?.componentId;

  if (!componentId) {
    return createNewComponentFromMeta(updatedField, parentId, nextTop);
    // componentId is not available, create a new component
  }

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
      type: updatedField.componentType,
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
