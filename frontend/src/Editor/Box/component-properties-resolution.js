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
