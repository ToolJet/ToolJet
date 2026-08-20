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
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
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
      validation: { schema: { type: 'string' }, defaultValue: '' },
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
      accordian: 'container',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-weak-border)' },
      accordian: 'container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'container',
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
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      collapseWhenHidden: { value: '{{false}}' },
      tooltipFormat: { value: 'plainText' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
