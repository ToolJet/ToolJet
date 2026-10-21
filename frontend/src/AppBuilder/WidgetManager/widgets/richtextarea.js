export const richtextareaConfig = {
  name: 'RichTextEditor',
  displayName: 'Text Editor',
  description: 'Rich text editor',
  component: 'RichTextEditor',
  defaultSize: {
    width: 16,
    height: 210,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Placeholder text',
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Default text',
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
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
  events: {},
  styles: {},
  exposedVariables: {
    value: '',
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: 'New text' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      placeholder: { value: 'Placeholder text' },
      defaultValue: { value: '' },
      loadingState: { value: `{{false}}` },
      dynamicHeight: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
    },
    events: [],
    styles: {},
  },
};
