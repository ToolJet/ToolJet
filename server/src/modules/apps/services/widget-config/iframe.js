export const iframeConfig = {
  name: 'Iframe',
  displayName: 'Iframe',
  description: 'Embed external content',
  defaultSize: {
    width: 10,
    height: 310,
  },
  component: 'IFrame',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    source: {
      type: 'code',
      displayName: 'URL',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://tooljet.io/',
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
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
  },
  events: {},
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'container',
    },
  },
  exposedVariables: {
    url: 'https://tooljet.io/',
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setUrl',
      displayName: 'Set URL',
      params: [{ handle: 'url', displayName: 'URL', defaultValue: '' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'visibility', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'reload',
      displayName: 'Reload',
    }
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      source: { value: 'https://tooljet.io/' },
      loadingState: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
    },
    events: [],
    styles: {
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
