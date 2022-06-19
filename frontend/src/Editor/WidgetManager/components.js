import { widgets } from './widgetConfig';

const universalProps = {
  properties: {},
  general: {
    tooltip: { type: 'code', displayName: 'Tooltip', validation: { schema: { type: 'string' } } },
  },
  others: {},
  events: {},
  styles: {},
  validate: true,
  definition: {
    others: {},
    events: [],
    styles: {},
  },
};

const combineProperties = (widget, universal, isArray = false) => {
  return {
    ...universal,
    ...widget,
    properties: { ...universal.properties, ...widget.properties },
    general: { ...universal.general, ...widget.general },
    others: { ...universal.others, ...widget.others },
    events: isArray ? [...universal.events, ...widget.events] : { ...universal.events, ...widget.events },
    styles: { ...universal.styles, ...widget.styles },
    exposedVariables: { ...universal.exposedVariables, ...widget.exposedVariables },
  };
};

export const componentTypes = widgets.map((widget) => {
  return {
    ...combineProperties(widget, universalProps),
    definition: combineProperties(widget.definition, universalProps.definition, true),
  };
});
