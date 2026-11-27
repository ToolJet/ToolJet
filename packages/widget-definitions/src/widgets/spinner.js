export const spinnerConfig = {
  name: 'Spinner',
  displayName: 'Spinner',
  description: 'Indicate loading state',
  component: 'Spinner',
  defaultSize: {
    width: 4,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {},
  events: {},
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    colour: {
      type: 'colorSwatches',
      displayName: 'Colour',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
    },
    size: {
      type: 'select',
      displayName: 'Size',
      options: [
        { name: 'small', value: 'sm' },
        { name: 'large', value: 'lg' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'sm',
      },
    },
  },
  exposedVariables: {},
  // The universal General Box Shadow, as a dropdown of the app theme's shadows + Custom (this shadow); the choice is
  // generalStyles.boxShadowStyle (the canvas merges generalStyles into the widget's styles).
  generalStyles: {
    boxShadow: { type: 'boxShadow', displayName: 'Box Shadow', themeTokens: 'shadows' },
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {},
    events: [],
    // New drops follow the theme's None shadow (NEW_DROP_ONLY_STYLES in ../utils.js).
    generalStyles: {
      boxShadowStyle: { value: 'none' },
    },
    styles: {
      visibility: { value: '{{true}}' },
      size: { value: 'sm' },
      colour: { value: 'var(--cc-primary-brand)' },
    },
  },
};
