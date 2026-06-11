import { deepClone } from '@/_helpers/utilities/utils.helpers';

export const processComponentMeta = (componentMeta, component, allComponents, resolvedCustomSchema) => {
  const tempComponentMeta = deepClone(componentMeta);

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];
  let deprecatedProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  // Categorize properties
  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'data') {
      dataProperties.push(key);
    } else if (componentMeta?.properties[key]?.section === 'deprecated') {
      deprecatedProperties.push(key);
    } else {
      // Skip the fields property as it is handled separately
      if (key === 'fields') continue;
      properties.push(key);
    }
  }

  // Process button to submit options
  const { id } = component;
  const newOptions = [{ name: 'None', value: 'none' }];

  Object.entries(allComponents).forEach(([componentId, _component]) => {
    const validParent =
      _component.component.parent === id ||
      _component.component.parent === `${id}-footer` ||
      _component.component.parent === `${id}-header`;
    if (validParent && _component?.component?.component === 'Button') {
      newOptions.push({ name: _component.component.name, value: componentId });
    }
  });

  tempComponentMeta.properties.buttonToSubmit.options = newOptions;

  // Hide header footer if custom schema is turned on
  if (resolvedCustomSchema) {
    component.component.properties.showHeader = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
    component.component.properties.showFooter = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
  }

  return {
    tempComponentMeta,
    properties,
    additionalActions,
    dataProperties,
    deprecatedProperties,
    events,
    validations,
  };
};
