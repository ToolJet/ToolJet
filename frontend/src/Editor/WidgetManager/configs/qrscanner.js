export const qrscannerConfig = {
  name: 'QrScanner',
  displayName: 'QR Scanner',
  description: 'Scan QR codes and hold its data',
  component: 'QrScanner',
  defaultSize: {
    width: 10,
    height: 300,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {},
  events: {
    onDetect: { displayName: 'On detect' },
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
    lastDetectedValue: '',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{true}}' },
    },
    properties: {},
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
