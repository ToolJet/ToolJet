export const colorPickerConfig = {
  name: 'ColorPicker',
  displayName: 'Color Picker',
  description: 'Choose colors from a palette',
  component: 'ColorPicker',
  properties: {
    defaultColor: { type: 'color', displayName: 'Default color' },
  },
  defaultSize: {
    width: 9,
    height: 40,
  },
  actions: [
    {
      displayName: 'Set Color',
      handle: 'setColor',
      params: [{ handle: 'color', displayName: 'color', defaultValue: '#ffffff', type: 'color' }],
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
    },
  },
};
