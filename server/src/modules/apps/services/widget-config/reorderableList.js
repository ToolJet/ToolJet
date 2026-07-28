export const reorderableListConfig = {
  name: 'ReorderableList',
  displayName: 'Reorderable List',
  description: 'Reorderable List',
  component: 'ReorderableList',
  defaultSize: {
    width: 10,
    height: 200,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    advanced: {
      type: 'toggle',
      displayName: 'Dynamic options',
      validation: {
        schema: { type: 'boolean' },
      },
      accordian: 'Options',
    },
    schema: {
      type: 'code',
      displayName: 'Schema',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
      accordian: 'Options',
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
    // Renders first in the Additional Actions section. Its displayName is the
    // visible "Tooltip" label for the whole pair; the `tooltip` code field below
    // hides its own label via showLabel:false so we don't get a duplicate.
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
      newLine: true, // render the switch on its own line below the "Tooltip" label
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'Text',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'Text',
    },
  },
  exposedVariables: {
    options: [],
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'disable',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'loading',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'disable',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      advanced: { value: '{{false}}' },
      schema: {
        value:
          '{{[{"label":"Card1","value":"1", "format": "plain"},{"label":"Card2","value":"2", "format": "plain"},{"label":"Card3","value":"3", "format": "plain"}]}}',
      },
      options: {
        value: [
          {
            format: 'plain',
            label: 'Card1',
            value: '1',
          },
          {
            format: 'plain',
            label: 'Card2',
            value: '2',
          },
          {
            format: 'plain',
            label: 'Card3',
            value: '3',
          },
        ],
      },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
    },
    events: [],
    styles: {
      textColor: { value: 'var(--cc-primary-text)' },
      padding: { value: 'default' },
    },
  },
};
