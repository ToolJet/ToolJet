export const GENERAL_TOOLTIP_FIELDS = {
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
  },
  tooltip: {
    type: 'code',
    displayName: 'Tooltip',
    validation: { schema: { type: 'string' } },
    placeholder: 'Enter tooltip text',
    showLabel: false,
  },
};

export const GENERAL_TOOLTIP_DEFAULTS = {
  tooltipFormat: { value: 'plainText' },
  tooltip: { value: '' },
};
