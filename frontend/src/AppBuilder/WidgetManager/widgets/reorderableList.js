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
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'Container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'Container',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      accordian: 'Container',
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
      accordian: 'Container',
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
        value: '{{[{"label":"Card1","value":"1"},{"label":"Card2","value":"2"},{"label":"Card3","value":"3"}]}}',
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
    },
    events: [],
    styles: {
      backgroundColor: { value: '' },
      padding: { value: 'default' },
      borderColor: { value: '' },
      borderRadius: { value: '6' },
    },
  },
};
