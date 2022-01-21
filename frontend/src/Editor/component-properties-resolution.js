import { resolveReferences } from '@/_helpers/utils';

export const resolveProperties = (component, currentState, defaultValue, customResolvables) => {
  if (currentState) {
    return Object.entries(component.definition.properties).reduce(
      (properties, entry) => ({
        ...properties,
        ...{ [entry[0]]: resolveReferences(entry[1].value, currentState, defaultValue, customResolvables) },
      }),
      {}
    );
  } else return {};
};

export const resolveStyles = (component, currentState, defaultValue, customResolvables) => {
  if (currentState) {
    const styles = component.definition.styles;
    return Object.entries(styles).reduce((resolvedStyles, entry) => {
      const key = entry[0];
      const value = resolveReferences(entry[1].value, currentState, defaultValue, customResolvables);
      return {
        ...resolvedStyles,
        ...{ [key]: value },
      };
    }, {});
  } else {
    return {};
  }
};
