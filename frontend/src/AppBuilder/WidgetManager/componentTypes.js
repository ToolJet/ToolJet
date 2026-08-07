import { widgets } from './configs/widgetConfig';
import { universalProps, combineProperties } from '@tooljet/widget-definitions';

export const componentTypes = widgets.map((widget) => {
  return {
    ...combineProperties(widget, universalProps),
    definition: combineProperties(widget.definition, universalProps.definition, true),
  };
});

export const componentTypeDefinitionMap = componentTypes.reduce((acc, component) => {
  acc[component.component] = component;
  return acc;
}, {});
