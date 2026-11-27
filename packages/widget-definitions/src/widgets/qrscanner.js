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
  // The universal General Box Shadow, as a dropdown of the app theme's shadows + Custom (this shadow); the choice is
  // generalStyles.boxShadowStyle (the canvas merges generalStyles into the widget's styles).
  generalStyles: {
    boxShadow: { type: 'boxShadow', displayName: 'Box Shadow', themeTokens: 'shadows' },
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{true}}' },
    },
    properties: {},
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
