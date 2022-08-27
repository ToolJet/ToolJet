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
  generalStyles: {
    boxShadow: { type: 'boxShadow', displayName: 'Box Shadow' },
  },
  definition: {
    others: {},
    events: [],
    styles: {},
    generalStyles: {
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
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
    generalStyles: { ...universal.generalStyles, ...widget.generalStyles },
    exposedVariables: { ...universal.exposedVariables, ...widget.exposedVariables },
  };
};

export const componentTypes = widgets.map((widget) => {
  return {
    ...combineProperties(widget, universalProps),
    definition: combineProperties(widget.definition, universalProps.definition, true),
  };
});
