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
    type: {
      type: 'switch',
      displayName: 'Slider type',
      options: [
        { displayName: 'Slider', value: 'slider' },
        { displayName: 'Range slider', value: 'rangeSlider' },
        { displayName: 'Legacy', value: 'legacy' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'slider' },
      fullWidth: true,
    },
    label: {
      type: 'code',
      displayName: 'Label',
      validation: { schema: { type: 'string' }, defaultValue: 'Label' },
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    min: {
      displayName: 'Min value',
      type: 'code',
      validation: {
        schema: { type: 'number' },
        defaultValue: 0,
      },
    },
    max: {
      displayName: 'Max value',
      type: 'code',
      validation: {
        schema: { type: 'number' },
        defaultValue: 100,
      },
    },
    value: {
      type: 'code',
      displayName: 'Value',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'array', element: { type: 'number' } }, { type: 'number' }],
        },
        defaultValue: 50,
      },
      conditionallyRender: {
        key: 'type',
        value: 'legacy',
      },
    },
    startValue: {
      type: 'code',
      displayName: 'Default start value',
      conditionallyRender: {
        key: 'type',
        value: 'rangeSlider',
      },
      validation: {
        schema: { type: 'number' },
        defaultValue: 50,
      },
    },
    endValue: {
      type: 'code',
      displayName: 'Default end value',
      conditionallyRender: {
        key: 'type',
        value: 'rangeSlider',
      },
      validation: {
        schema: { type: 'number' },
        defaultValue: 80,
      },
    },
    stepSize: {
      type: 'code',
      displayName: 'Step size',
      validation: {
        schema: { type: 'number' },
        defaultValue: 1,
      },
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    enableTwoHandle: {
      type: 'toggle',
      displayName: 'Two handles',
      isFxNotRequired: true,
      fullWidth: true,
      defaultValue: false,
      conditionallyRender: {
        key: 'type',
        value: 'legacy',
      },
    },
    schema: {
      type: 'code',
      displayName: 'Set marks',
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
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
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
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
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
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
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
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
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    width: {
      type: 'slider',
      displayName: 'Width',
      accordian: 'label',
      isFxNotRequired: true,
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    auto: {
      type: 'checkbox',
      displayName: 'auto',
      showLabel: false,
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'label',
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
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
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
      },
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
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'num1', displayName: 'Value', defaultValue: 'New value' }],
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    {
      handle: 'setRangeValue',
      displayName: 'Set range value',
      params: [
        { handle: 'num1', displayName: 'Min value' },
        { handle: 'num2', displayName: 'Max value' },
      ],
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    {
      handle: 'reset',
      displayName: 'Reset',
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
      conditionallyRender: {
        key: 'type',
        value: ['slider', 'rangeSlider'],
        comparator: 'in',
      },
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
      enableTwoHandle: { value: false },
      type: { value: 'slider' },
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
      lineColor: { value: 'var(--cc-surface3-surface)' },
      handleColor: { value: 'var(--cc-surface1-surface)' },
      handleBorderColor: { value: 'var(--cc-default-border)' },
      trackColor: { value: 'var(--cc-primary-brand)' },
      markerLabel: { value: 'var(--cc-primary-text)' },
      direction: { value: 'left' },
      width: { value: '{{33}}' },
      alignment: { value: 'side' },
      color: { value: 'var(--cc-primary-text)' },
      auto: { value: '{{true}}' },
      padding: { value: 'default' },
    },
  },
};
