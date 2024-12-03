import { resolveReferences } from '@/_helpers/utils';

import { resolveReferences as newResolveReference } from '@/AppBuilder/CodeEditor/utils';

const handleResolveReferences = (initialValue, defaultValue, customResolvers) => {
  const [_, error, value] = newResolveReference(initialValue, {}, customResolvers);

  if (error) {
    return defaultValue;
  }

  return value;
};

export const resolveProperties = (component, currentState, defaultValue, customResolvables) => {
  if (currentState) {
    return Object.entries(component.definition.properties).reduce(
      (properties, entry) => ({
        ...properties,
        ...{
          [entry[0]]: entry[1]?.skipResolve
            ? entry[1].value
            : handleResolveReferences(entry[1].value, defaultValue, customResolvables),
        },
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
      const value = entry[1]?.skipResolve
        ? entry[1].value
        : handleResolveReferences(entry[1].value, defaultValue, customResolvables);
      return {
        ...resolvedStyles,
        ...{ [key]: value },
      };
    }, {});
  } else {
    return {};
  }
};

export const resolveGeneralProperties = (component, currentState, defaultValue, customResolvables) => {
  if (currentState) {
    const generalProperties = component.definition?.general ?? {};
    return Object.entries(generalProperties).reduce((resolvedGeneral, entry) => {
      const key = entry[0];
      const value = entry[1]?.skipResolve
        ? entry[1].value
        : handleResolveReferences(entry[1].value, defaultValue, customResolvables);
      return {
        ...resolvedGeneral,
        ...{ [key]: value },
      };
    }, {});
  } else {
    return {};
  }
};

export const resolveGeneralStyles = (component, currentState, defaultValue, customResolvables) => {
  if (currentState) {
    const generalStyles = component.definition?.generalStyles ?? {};
    return Object.entries(generalStyles).reduce((resolvedGeneral, entry) => {
      const key = entry[0];
      const value = entry[1]?.skipResolve
        ? entry[1].value
        : handleResolveReferences(entry[1].value, defaultValue, customResolvables);
      return {
        ...resolvedGeneral,
        ...{ [key]: value },
      };
    }, {});
  } else {
    return {};
  }
};
