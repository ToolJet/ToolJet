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
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
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
  // The universal General Box Shadow, as a dropdown of the app theme's shadows + Custom (this shadow); the choice is
  // generalStyles.boxShadowStyle (the canvas merges generalStyles into the widget's styles).
  generalStyles: {
    boxShadow: { type: 'boxShadow', displayName: 'Box Shadow', themeTokens: 'shadows' },
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
      collapseWhenHidden: { value: '{{false}}' },
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
    // New drops follow the theme's None shadow (NEW_DROP_ONLY_STYLES in ../utils.js).
    generalStyles: {
      boxShadowStyle: { value: 'none' },
    },
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
