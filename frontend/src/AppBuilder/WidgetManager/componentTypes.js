import { widgets } from './configs/widgetConfig';
import {
  NEW_REVAMPED_COMPONENTS,
  universalProps,
  legacyUniversalProps,
  combineProperties,
} from '@tooljet/widget-definitions';

const newRevampedComponents = new Set(NEW_REVAMPED_COMPONENTS);

export const componentTypes = widgets.map((widget) => {
  const baseProps = newRevampedComponents.has(widget.component) ? universalProps : legacyUniversalProps;
  const combined = {
    ...combineProperties(widget, baseProps),
    definition: combineProperties(widget.definition, baseProps.definition, true),
  };
  if (widget.component === 'LibraryComponent') {
    delete combined.styles.cssClass;
    delete combined.definition.styles.cssClass;
  }
  return combined;
});

export const componentTypeDefinitionMap = componentTypes.reduce((acc, component) => {
  acc[component.component] = component;
  return acc;
}, {});
