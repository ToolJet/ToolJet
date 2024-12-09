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
  },
  validation: {},
  events: {
    onStart: { displayName: 'On Start' },
    onResume: { displayName: 'On Resume' },
    onPause: { displayName: 'On Pause' },
    onCountDownFinish: { displayName: 'On Count Down Finish' },
    onReset: { displayName: 'On Reset' },
  },
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  exposedVariables: {
    value: '',
  },
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
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
