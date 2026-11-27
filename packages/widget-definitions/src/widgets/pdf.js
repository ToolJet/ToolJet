export const pdfConfig = {
  name: 'PDF',
  displayName: 'PDF',
  description: 'Embed PDF documents',
  component: 'PDF',
  properties: {
    url: {
      type: 'code',
      displayName: 'File URL',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://upload.wikimedia.org/wikipedia/commons/general.pdf',
      },
    },
    scale: {
      type: 'toggle',
      displayName: 'Scale page to width',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
    pageControls: {
      type: 'toggle',
      displayName: 'Show page controls',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
    showDownloadOption: {
      type: 'toggle',
      displayName: 'Show download button',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
  },
  defaultSize: {
    width: 20,
    height: 640,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  events: {},
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
    },
    borderRadius: {
      // A dropdown of the app theme's radii + Custom (this number); the choice is styles.borderRadiusStyle.
      themeTokens: 'borderRadius',
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 6,
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
    properties: {
      url: {
        value:
          'https://upload.wikimedia.org/wikipedia/commons/e/ee/Guideline_No._GD-Ed-2214_Marman_Clamp_Systems_Design_Guidelines.pdf',
      },
      scale: {
        value: '{{true}}',
      },
      pageControls: {
        value: `{{true}}`,
      },
      showDownloadOption: {
        value: `{{true}}`,
      },
      collapseWhenHidden: { value: '{{false}}' },
    },
    events: [],
    // New drops follow the theme's None shadow (NEW_DROP_ONLY_STYLES in ../utils.js).
    generalStyles: {
      boxShadowStyle: { value: 'none' },
    },
    styles: {
      // New drops follow the theme's Large radius; a saved widget without the key keeps its own value
      // (NEW_DROP_ONLY_STYLES in ../utils.js).
      borderRadiusStyle: { value: 'large' },
      visibility: { value: '{{true}}' },
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: 6 },
    },
  },
};
