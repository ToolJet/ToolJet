import { resolveReferences } from '@/_helpers/utils';

export const resolveProperties = (component, currentState, defaultValue, customResolvables) => {
  if (currentState) {
    return Object.entries(component.definition.properties).reduce(
      (properties, entry) => ({
        ...properties,
        ...{
          [entry[0]]: entry[1]?.skipResolve
            ? entry[1].value
            : resolveReferences({ object: entry[1].value, currentState, customObjects: customResolvables }),
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
        : resolveReferences({ object: entry[1].value, currentState, customObjects: customResolvables });
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
        : resolveReferences({ object: entry[1].value, currentState, customObjects: customResolvables });
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
        : resolveReferences({ object: entry[1].value, currentState, customObjects: customResolvables });
      return {
        ...resolvedGeneral,
        ...{ [key]: value },
      };
    }, {});
  } else {
    return {};
  }
};
