import { resolveReferences } from '@/_helpers/utils';

export const resolveProperties = (component, currentState) => {
  if (currentState && currentState.components[component.name]) {
    const properties = component.definition.properties;
    return Object.entries(properties).reduce((resolvedProperties, entry) => {
      const key = entry[0];
      const definitionValue = entry[1].value;
      const currentStateValue = currentState.components[component.name][key];
      const value = currentStateValue != undefined ? currentStateValue : definitionValue;
      return {
        ...resolvedProperties,
        ...{ [key]: resolveReferences(value, currentState) },
      };
    }, {});
  } else {
    return {};
  }
};

export const resolveStyles = (component, currentState) => {
  if (currentState && currentState.components[component.name]) {
    const styles = currentState.components[component.name].styles;
    return Object.entries(styles).reduce((resolvedStyles, entry) => {
      const key = entry[0];
      const value = resolveReferences(entry[1], currentState);
      return {
        ...resolvedStyles,
        ...{ [key]: value },
      };
    }, {});
  } else {
    return {};
  }
};
