export const rangeSliderConfig = {
  name: 'RangeSlider',
  displayName: 'Range Slider',
  description: 'Adjust value range',
  component: 'RangeSlider',
  defaultSize: {
    width: 9,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    enableTwoHandle: {
      type: 'switch',
      displayName: 'Slider type',
      options: [
        { displayName: 'Slider', value: 'slider' },
        { displayName: 'Range slider', value: 'rangeSlider' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'slider' },
      fullWidth: true,
    },
    label: {
      type: 'code',
      displayName: 'Label',
      validation: { schema: { type: 'string' }, defaultValue: 'Label' },
    },
    min: {
      type: 'number',
      displayName: 'Min value',
      validation: {
        schema: { type: 'number' },
        defaultValue: 0,
      },
    },
    max: {
      type: 'number',
      displayName: 'Max value',
      validation: {
        schema: { type: 'number' },
        defaultValue: 100,
      },
    },
    value: {
      type: 'number',
      displayName: 'Default value',
      conditionallyRender: {
        key: 'enableTwoHandle',
        value: 'slider',
      },

      validation: {
        schema: {
          schema: { type: 'number' },
          defaultValue: 50,
        },
      },
    },
    startValue: {
      type: 'number',
      displayName: 'Default start value',
      conditionallyRender: {
        key: 'enableTwoHandle',
        value: 'rangeSlider',
      },

      validation: {
        schema: {
          schema: { type: 'number' },
          defaultValue: 50,
        },
      },
    },
    endValue: {
      type: 'number',
      displayName: 'Default end value',
      conditionallyRender: {
        key: 'enableTwoHandle',
        value: 'rangeSlider',
      },

      validation: {
        schema: {
          schema: { type: 'number' },
          defaultValue: 80,
        },
      },
    },
    stepSize: {
      type: 'number',
      displayName: 'Step size',
      validation: {
        schema: { type: 'number' },
        defaultValue: 1,
      },
    },
    schema: {
      type: 'code',
      displayName: 'Set marks',
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
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    color: {
      type: 'colorSwatches',
      displayName: 'Color',
      validation: { schema: { type: 'string' }, defaultValue: '#1B1F24' },
      accordian: 'label',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'side' },
      options: [
        { displayName: 'Side', value: 'side' },
        { displayName: 'Top', value: 'top' },
      ],
      accordian: 'label',
    },
    direction: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'label',
      isFxNotRequired: true,
    },
    width: {
      type: 'slider',
      displayName: 'Width',
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    auto: {
      type: 'checkbox',
      displayName: 'auto',
      showLabel: false,
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    lineColor: {
      type: 'colorSwatches',
      displayName: 'Track',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#E4E7EB',
      },
      accordian: 'slider',
    },
    trackColor: {
      type: 'colorSwatches',
      displayName: 'Accent',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#4368E3',
      },
      accordian: 'slider',
    },
    handleColor: {
      type: 'colorSwatches',
      displayName: 'Handle',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#FFFFFF',
      },
      accordian: 'slider',
    },
    handleBorderColor: {
      type: 'colorSwatches',
      displayName: 'Handle border',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ACB2B9',
      },
      accordian: 'slider',
    },
    markerLabel: {
      type: 'colorSwatches',
      displayName: 'Marker label',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#1B1F24',
      },
      accordian: 'slider',
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
    value: null,
    label: 'Label',
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'num1', displayName: 'Value', defaultValue: 'New value' }],
    },
    {
      handle: 'setRangeValue',
      displayName: 'Set range value',
      params: [
        { handle: 'num1', displayName: 'Min value' },
        { handle: 'num2', displayName: 'Max value' },
      ],
    },
    {
      handle: 'reset',
      displayName: 'Reset',
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: true },
      showOnMobile: { value: false },
    },
    properties: {
      label: { value: 'Label' },
      min: {
        value: '{{0}}',
      },
      max: {
        value: '{{100}}',
      },
      value: {
        value: '{{50}}',
      },
      startValue: {
        value: '{{50}}',
      },
      endValue: {
        value: '{{80}}',
      },
      enableTwoHandle: { value: 'slider' },
      stepSize: {
        value: '{{1}}',
      },
      schema: {
        value: "{{[\t{label: '25%',value: 25},{label: '50%',value: 50},{label: '75%',value: 75}\t]}}",
      },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      lineColor: { value: '#E4E7EB' },
      handleColor: { value: '#FFFFFF' },
      handleBorderColor: { value: '#ACB2B9' },
      trackColor: { value: 'var(--primary-brand)' },
      markerLabel: { value: '#1B1F24' },
      direction: { value: 'left' },
      width: { value: '{{33}}' },
      alignment: { value: 'side' },
      color: { value: '#1B1F24' },
      auto: { value: '{{true}}' },
      padding: { value: 'default' },
    },
  },
};
