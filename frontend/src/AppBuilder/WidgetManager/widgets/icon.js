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
    // Renders first in the Additional Actions section. Its displayName is the
    // visible "Tooltip" label for the whole pair; the `tooltip` code field below
    // hides its own label via showLabel:false so we don't get a duplicate.
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
      newLine: true, // render the switch on its own line below the "Tooltip" label
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
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
      accordian: 'Icon',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
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
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
    },
    events: [],
    styles: {
      iconColor: { value: '#000' },
      iconAlign: { value: 'center' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
