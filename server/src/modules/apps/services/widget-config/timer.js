export const timerConfig = {
  name: 'Timer',
  displayName: 'Timer',
  description: 'Countdown or stopwatch',
  component: 'Timer',
  defaultSize: {
    width: 11,
    height: 128,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    value: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'string' },
        defaultValue: '00:00:00:000',
      },
    },
    type: {
      type: 'select',
      displayName: 'Timer type',
      options: [
        { name: 'Count up', value: 'countUp' },
        { name: 'Count down', value: 'countDown' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'countUp',
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
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
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
  validation: {},
  events: {
    onStart: { displayName: 'On Start' },
    onResume: { displayName: 'On Resume' },
    onPause: { displayName: 'On Pause' },
    onCountDownFinish: { displayName: 'On Count Down Finish' },
    onReset: { displayName: 'On Reset' },
  },
  styles: {},
  exposedVariables: {
    value: '',
    isVisible: true,
    isDisabled: false,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    validation: {},
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      value: {
        value: '00:00:00:000',
      },
      type: {
        value: 'countUp',
      },
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
    },
    defaults: [
      {
        type: 'countUp',
        value: '00:00:00:000',
        paramName: 'value',
      },
      {
        type: 'countDown',
        value: '00:00:10:000',
        paramName: 'value',
      },
    ],
    events: [],
    styles: {},
  },
};
