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
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    // Renders first in the Tooltip pair. Its displayName is the visible "Tooltip" label for the
    // whole pair; the `tooltip` code field below hides its own label via showLabel:false.
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
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
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 6,
      },
    },
  },
  exposedVariables: {
    isVisible: true,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
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
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
    },
    events: [],
    styles: {
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: 6 },
    },
  },
};
