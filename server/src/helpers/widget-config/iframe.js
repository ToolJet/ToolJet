export const iframeConfig = {
  name: 'Iframe',
  displayName: 'Iframe',
  description: 'Embed external content',
  defaultSize: {
    width: 10,
    height: 310,
  },
  component: 'IFrame',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    source: {
      type: 'code',
      displayName: 'URL',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://tooljet.io/',
      },
    },
  },
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
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      source: { value: 'https://tooljet.io/' },
      visible: { value: '{{true}}' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
