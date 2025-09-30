export const circularProgressbarConfig = {
  name: 'CircularProgressBar',
  displayName: 'Circular Progressbar',
  description: 'Show circular progress',
  component: 'CircularProgressBar',
  defaultSize: {
    width: 7,
    height: 50,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    labelType: {
      type: 'switch',
      displayName: 'Label',
      validation: { schema: { type: 'string' } },
      showLabel: true,
      options: [
        { displayName: 'Auto', value: 'auto' },
        { displayName: 'Custom', value: 'custom' },
      ],
      accordian: 'Data',
      isFxNotRequired: true,
    },
    text: {
      type: 'code',
      displayName: ' ',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'text',
      },
      accordian: 'Data',
      conditionallyRender: {
        key: 'labelType',
        value: 'custom',
      },
    },
    allowNegativeProgress: {
      type: 'toggle',
      displayName: 'Allow negative progress',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      accordian: 'Data',
    },
    progress: {
      type: 'code',
      displayName: 'Progress',
      validation: {
        schema: { type: 'number' },
        defaultValue: 50,
      },
      accordian: 'Data',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
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
  },
  events: {},
  styles: {
    textColor: {
      type: 'colorSwatches',
      displayName: 'Color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-text)',
      },
      accordian: 'label',
    },
    textSize: {
      type: 'slider',
      displayName: 'Size',
      validation: {
        schema: { type: 'number' },
        defaultValue: 16,
      },
      accordian: 'label',
    },
    trackColor: {
      type: 'colorSwatches',
      displayName: 'Track',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface3-surface)',
      },
      accordian: 'progress circle',
    },
    color: {
      type: 'colorSwatches',
      displayName: 'Positive',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
      accordian: 'progress circle',
    },
    negativeColor: {
      type: 'colorSwatches',
      displayName: 'Negative',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-error-systemStatus)',
      },
      accordian: 'progress circle',
    },
    completionColor: {
      type: 'colorSwatches',
      displayName: 'Completion',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-success-systemStatus)',
      },
      accordian: 'progress circle',
    },
    strokeWidth: {
      type: 'slider',
      options: {
        className: 'circular-progressbar-stroke-width',
      },
      displayName: 'Progress bar width',
      validation: {
        schema: { type: 'number' },
        defaultValue: 10,
      },
      accordian: 'progress circle',
    },
    circleRatio: {
      type: 'slider',
      displayName: 'Circle ratio',
      validation: {
        schema: { type: 'number' },
        defaultValue: 1,
      },
      min: 0,
      max: 1,
      step: 0.01,
      parseType: 'float',
      staticInputText: '',
      accordian: 'progress circle',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'center' },
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'flex-start', iconName: 'alignleftinspector' },
        { displayName: 'alignhorizontalcenter', value: 'center', iconName: 'alignhorizontalcenter' },
        { displayName: 'alignrightinspector', value: 'flex-end', iconName: 'alignrightinspector' },
      ],
      accordian: 'progress circle',
      isFxNotRequired: true,
    },
    counterClockwise: {
      type: 'toggle',
      displayName: 'Counter clockwise rotation',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'progress circle',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: { schema: { type: 'string' }, defaultValue: 'default' },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'Container',
    },
  },
  exposedVariables: {
    value: 50,
    isVisible: true,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{50}}', type: 'number' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],

  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      labelType: { value: 'auto' },
      text: {
        value: '',
      },
      progress: {
        value: '{{50}}',
      },
      tooltip: { value: '' },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      allowNegativeProgress: { value: '{{false}}' },
    },
    events: [],
    styles: {
      textColor: { value: 'var(--cc-primary-text)' },
      textSize: { value: '{{16}}' },
      trackColor: { value: 'var(--cc-surface3-surface)' },
      color: { value: 'var(--cc-primary-brand)' },
      negativeColor: { value: 'var(--cc-error-systemStatus)' },
      completionColor: { value: 'var(--cc-success-systemStatus)' },
      strokeWidth: { value: '{{10}}' },
      circleRatio: { value: '{{1}}' },
      counterClockwise: { value: '{{false}}' },
      alignment: { value: 'center' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      padding: { value: 'default' },
    },
  },
};
