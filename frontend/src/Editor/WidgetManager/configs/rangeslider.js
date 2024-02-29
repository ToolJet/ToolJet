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
    min: {
      type: 'number',
      displayName: 'Min',
      validation: {
        schema: { type: 'number' },
        defaultValue: 0,
      },
    },
    max: {
      type: 'number',
      displayName: 'Max',
      validation: {
        schema: { type: 'number' },
        defaultValue: 100,
      },
    },
    value: {
      type: 'code',
      displayName: 'Value',
      validation: {
        schema: { type: 'number' },
        defaultValue: 50,
      },
    },
    enableTwoHandle: {
      type: 'toggle',
      displayName: 'Two handles',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    lineColor: {
      type: 'color',
      displayName: 'Line color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
    handleColor: {
      type: 'color',
      displayName: 'Handle color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
    trackColor: {
      type: 'color',
      displayName: 'Track color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
    visibility: {
      type: 'code',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
  },
  exposedVariables: {
    value: null,
  },
  definition: {
    others: {
      showOnDesktop: { value: true },
      showOnMobile: { value: false },
    },
    properties: {
      min: {
        value: '{{0}}',
      },
      max: {
        value: '{{100}}',
      },
      value: {
        value: '{{50}}',
      },
      enableTwoHandle: { value: false },
    },
    events: [],
    styles: {
      lineColor: { value: '' },
      handleColor: { value: '' },
      trackColor: { value: '' },
      visibility: { value: '{{true}}' },
    },
  },
};
