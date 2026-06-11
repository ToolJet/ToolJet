import { merge, set } from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { v4 as uuidv4 } from 'uuid';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { ensureHandlebars, buildOptions } from './utils';
import { COMPONENT_LAYOUT_DETAILS, COMPONENT_WITH_OPTIONS } from '../constants';

export const createNewComponentFromMeta = (column, parentId, nextTop) => {
  const currentLayout = useStore.getState().currentLayout;
  const componentType = column.componentType || 'TextInput';
  const fieldId = uuidv4();

  const componentMeta = componentTypes.find((comp) => comp.component === componentType);

  if (!componentMeta) {
    console.error(`Component type ${componentType} not found in componentTypes`);
    return;
  }

  const defaultHeight = componentMeta.defaultSize?.height || COMPONENT_LAYOUT_DETAILS.defaultHeight;

  const componentData = deepClone(componentMeta);
  const componentName = useStore.getState().generateUniqueComponentNameFromBaseName(column.name);

  const addOptions = COMPONENT_WITH_OPTIONS.includes(componentType);

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
          ...(addOptions && { options: componentData.definition.properties.options }),
        },
        styles: {
          alignment: { value: 'top' },
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

  setValuesBasedOnType(column, componentType, formField, false);

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
    // componentId is not available, create a new component
    return createNewComponentFromMeta(updatedField, parentId, nextTop);
  }

  // Get the current component from the store
  const componentToUpdate = useStore.getState().getComponentDefinition(componentId);

  if (!componentToUpdate) {
    console.error(`Component with ID ${componentId} not found`);
    return null;
  }

  if (updatedField.componentType !== componentToUpdate.component.component) {
    return handleComponentTypeChange(componentToUpdate, updatedField);
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

  // Update visibility status
  if (updatedField.visibility !== currentField.visibility) {
    set(updatedComponent.component.definition.properties, 'visibility', updatedField.visibility);
  }

  // Update component type specific properties
  const componentType = updatedField.componentType || componentToUpdate.component.component;

  setValuesBasedOnType(updatedField, componentType, updatedComponent, false);

  return { updated: diff(componentToUpdate, updatedComponent) };
};

const handleComponentTypeChange = (componentToUpdate, updatedField) => {
  const newComponentId = uuidv4();

  const addOptions =
    COMPONENT_WITH_OPTIONS.includes(updatedField.componentType) &&
    COMPONENT_WITH_OPTIONS.includes(componentToUpdate.component.component);

  const currentLayout = useStore.getState().currentLayout;
  const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';

  const componentMeta = componentTypes.find((comp) => comp.component === updatedField.componentType);

  if (!componentMeta) {
    console.error(`Component type ${updatedField.componentType} not found in componentTypes`);
    return null;
  }

  const existingLayouts = componentToUpdate.layouts || {};

  const componentName = useStore
    .getState()
    .generateUniqueComponentNameFromBaseName(updatedField.name || componentToUpdate.component.name);

  const componentData = deepClone(componentMeta);

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
        },
        styles: {
          alignment: { value: 'top' },
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

  if (addOptions) {
    set(
      newComponent.component.definition.properties,
      'options',
      componentToUpdate.component.definition.properties.options
    );
  }

  setValuesBasedOnType(updatedField, updatedField.componentType, newComponent, true);

  // Return an object that indicates to:
  // 1. Delete the old component
  // 2. Add the new component
  return {
    deleted: true,
    added: newComponent,
    updated: {},
  };
};

const setValuesBasedOnType = (column, componentType, formField, isTypeChange = false) => {
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
      if (!isTypeChange) {
        const generatedOptions = buildOptions(column.value);
        const val = Array.isArray(generatedOptions)
          ? generatedOptions
          : formField.component.definition.properties?.options.value;
        set(formField.component.definition.properties, 'options.value', val);
      } else if (Array.isArray(formField.component.definition.properties?.options)) {
        set(
          formField.component.definition.properties,
          'options.value',
          buildOptions(formField.component.definition.properties.options)
        );
      }
    }
  }

  if (isTypeChange && componentType === 'TextArea') {
    set(formField, 'layouts.desktop.height', 50);
    set(formField, 'layouts.mobile.height', 50);
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
  const visibility = definition.properties?.visibility;
  const selected = true;
  const placeholder = definition.properties?.placeholder?.value || '';

  return {
    label,
    name,
    value,
    mandatory,
    visibility,
    selected,
    placeholder,
    componentType,
  };
};
