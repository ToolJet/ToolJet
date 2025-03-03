export const iconConfig = {
  name: 'Icon',
  displayName: 'Icon',
  description: 'Icon',
  defaultSize: {
    width: 5,
    height: 48,
  },
  component: 'Icon',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    icon: {
      type: 'iconPicker',
      displayName: 'Icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'IconHome2',
      },
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
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
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
  },
  events: {
    onClick: { displayName: 'On click' },
    onHover: { displayName: 'On hover' },
  },
  styles: {
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000',
      },
      accordian: 'Icon',
    },
    iconAlign: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'center',
      },
      accordian: 'Icon',
    },
  },
  exposedVariables: {},
  actions: [
    {
      handle: 'click',
      displayName: 'Click',
    },
    {
      displayName: 'Set Visibility',
      handle: 'setVisibility',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      icon: { value: 'IconHome2' },
      loadingState: { value: `{{false}}` },
      disabledState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
    },
    events: [],
    styles: {
      iconColor: { value: '#000' },
      iconAlign: { value: 'center' },
    },
  },
};
