import { resolveReferences } from '@/_helpers/utils';

export const resolveProperties = (component, currentState) => {
  if (currentState && currentState.components[component.name]) {
    return Object.entries(component.definition.properties).reduce(
      (properties, entry) => ({
        ...properties,
        ...{ [entry[0]]: resolveReferences(entry[1].value, currentState) },
      }),
      {}
    );
  } else return {};
};

export const resolveStyles = (component, currentState) => {
  if (currentState && currentState.components[component.name]) {
    const styles = component.definition.styles;
    return Object.entries(styles).reduce((resolvedStyles, entry) => {
      const key = entry[0];
      const value = resolveReferences(entry[1].value, currentState);
      return {
        ...resolvedStyles,
        ...{ [key]: value },
      };
    }, {});
  } else {
    return {};
  }
};
