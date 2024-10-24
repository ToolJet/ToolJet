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
  },
  exposedVariables: {},
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
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
    },
  },
};
