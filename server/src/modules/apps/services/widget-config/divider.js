export const dividerConfig = {
  name: 'HorizontalDivider',
  displayName: 'Horizontal Divider',
  description: 'Separator between components',
  component: 'Divider',
  defaultSize: {
    width: 10,
    height: 10,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {},
  styles: {
    dividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider color',
      validation: {
        schema: { type: 'string' },
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {},
  styles: {
    dividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
      },
      accordian: 'Divider',
    },
    dividerStyle: {
      type: 'switch',
      displayName: 'Style',
      validation: {
        schema: { type: 'string' },
      },
      options: [
        { displayName: 'Solid', value: 'solid' },
        { displayName: 'Dashed', value: 'dashed' },
      ],
      accordian: 'Divider',
    },
    labelAlignment: {
      type: 'switch',
      displayName: 'Label alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      isIcon: true,
      showLabel: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignhorizontalcenter', value: 'center', iconName: 'alignhorizontalcenter' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'Divider',
      isFxNotRequired: true,
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label Color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'Divider',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Divider',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
  },
  exposedVariables: {
    value: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: '' },
      visibility: { value: '{{true}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      dividerColor: { value: '#CCD1D5' },
      labelAlignment: { value: 'center' },
      dividerStyle: { value: 'solid' },
      labelColor: { value: '#6A727C' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
