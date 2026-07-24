import { widgets } from './configs/widgetConfig';

const NEW_REVAMPED_COMPONENTS = [
  'Text',
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'EmailInput',
  'DropdownV2',
  'Table',
  'Button',
  'Checkbox',
  'Divider',
  'VerticalDivider',
  'Link',
  'Datepicker',
  'DatePickerV2',
  'TimePicker',
  'DatetimePickerV2',
  'DaterangePicker',
  'TextArea',
  'Container',
  'Tabs',
  'Form',
  'Image',
  'FilePicker',
  'Icon',
  'Steps',
  'Statistics',
  'StarRating',
  'Tags',
  'CircularProgressBar',
  'Html',
  'Chat',
  'CurrencyInput',
  'PhoneInput',
  'IFrame',
  'TreeSelect',
  'Listview',
  'ColorPicker',
  'ButtonGroupV2',
  'ModalV2',
  'PopoverMenu',
];

const newRevampedComponents = new Set(NEW_REVAMPED_COMPONENTS);

const universalProps = {
  properties: {},
  general: {
    tooltip: { type: 'code', displayName: 'Tooltip', validation: { schema: { type: 'string' } } },
  },
  others: {},
  events: {},
  styles: {
    cssClass: { type: 'code', displayName: 'CSS class', accordian: 'Advanced' },
  },
  validate: true,
  generalStyles: {},
  definition: {
    others: {},
    events: [],
    styles: {},
    generalStyles: {},
  },
};

const legacyUniversalProps = {
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
    styles: {
      cssClass: { value: '' },
    },
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
  const baseProps = newRevampedComponents.has(widget.component) ? universalProps : legacyUniversalProps;
  return {
    ...combineProperties(widget, baseProps),
    definition: combineProperties(widget.definition, baseProps.definition, true),
  };
});

export const componentTypeDefinitionMap = componentTypes.reduce((acc, component) => {
  acc[component.component] = component;
  return acc;
}, {});
