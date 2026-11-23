// Components that have been revamped onto the new design system: they drop the legacy
// universal `boxShadow` general style and `definition.properties` seed.
export const NEW_REVAMPED_COMPONENTS = [
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

export const universalProps = {
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
    styles: {
      cssClass: { value: '' },
    },
    generalStyles: {},
  },
};

export const legacyUniversalProps = {
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
  generalStyles: {
    boxShadow: { type: 'boxShadow', displayName: 'Box Shadow' },
  },
  definition: {
    properties: {},
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

export const combineProperties = (widget, universal, isArray = false) => {
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

// Defaults only a new FlexContainer gets (UI 2.0's layoutVersion '2' and Equal heights). ToolJet merges a widget's
// default definition into saved components (the frontend's buildComponentMetaDefinition on a cloned page, the server's
// on every load), which would stamp them onto every container saved before UI 2.0 and switch its layout. Both merges
// take them back out with dropNewContainerDefaults.
const NEW_CONTAINER_ONLY_DEFAULTS = ['layoutVersion', 'equalHeights'];

/**
 * Takes the new-container-only defaults back out of a saved FlexContainer's merged properties when the saved
 * properties did not have them.
 * @param {string} componentType
 * @param {Record<string, unknown>} mergedProperties  the widget's defaults merged with the saved properties
 * @param {Record<string, unknown> | undefined} savedProperties
 * @returns {Record<string, unknown>} a copy of mergedProperties without the keys the saved container did not have
 */
export const dropNewContainerDefaults = (componentType, mergedProperties, savedProperties) => {
  if (componentType !== 'FlexContainer' || !mergedProperties) return mergedProperties;
  const properties = { ...mergedProperties };
  NEW_CONTAINER_ONLY_DEFAULTS.forEach((key) => {
    if (savedProperties?.[key] === undefined) delete properties[key];
  });
  return properties;
};
