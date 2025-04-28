export const colorPickerConfig = {
  name: 'ColorPicker',
  displayName: 'Color Picker',
  description: 'Choose colors from a palette',
  component: 'ColorPicker',
  properties: {
    defaultColor: { type: 'colorSwatches', displayName: 'Default color' },
  },
  defaultSize: {
    width: 9,
    height: 40,
  },
  actions: [
    {
      displayName: 'Set Color',
      handle: 'setColor',
      params: [
        { handle: 'colorSwatches', displayName: 'colorSwatches', defaultValue: '#ffffff', type: 'colorSwatches' },
      ],
    },
  ],
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    visibility: { type: 'toggle', displayName: 'Visibility' },
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
    },
  },
  exposedVariables: {
    selectedColorHex: '#000000',
    selectedColorRGB: 'rgb(0,0,0)',
    selectedColorRGBA: 'rgba(0, 0, 0, 1)',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      defaultColor: {
        value: '#000000',
      },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      padding: { value: 'default' },
    },
  },
};
