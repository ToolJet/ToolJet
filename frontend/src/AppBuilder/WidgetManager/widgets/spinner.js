export const spinnerConfig = {
  name: 'Spinner',
  displayName: 'Spinner',
  description: 'Indicate loading state',
  component: 'Spinner',
  defaultSize: {
    width: 4,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    // Renders first in the Tooltip pair. Its displayName is the visible "Tooltip" label for the
    // whole pair; the `tooltip` code field below hides its own label via showLabel:false.
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
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {},
  styles: {
    colour: {
      type: 'colorSwatches',
      displayName: 'Colour',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
    },
    size: {
      type: 'select',
      displayName: 'Size',
      options: [
        { name: 'small', value: 'sm' },
        { name: 'large', value: 'lg' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'sm',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
    },
    events: [],
    styles: {
      size: { value: 'sm' },
      colour: { value: 'var(--cc-primary-brand)' },
    },
  },
};
