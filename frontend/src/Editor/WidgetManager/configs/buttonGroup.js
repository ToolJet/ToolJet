export const buttonGroupConfig = {
  name: 'ButtonGroup',
  displayName: 'Button Group',
  description: 'Group of buttons',
  component: 'ButtonGroup',
  properties: {
    label: {
      type: 'code',
      displayName: 'label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Button group',
      },
    },
    values: {
      type: 'code',
      displayName: 'values',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } }],
        },
        defaultValue: '[]',
      },
    },
    labels: {
      type: 'code',
      displayName: 'Labels',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } }],
        },
        defaultValue: '[]',
      },
    },
    defaultSelected: {
      type: 'code',
      displayName: 'Default selected',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } }],
        },
        defaultValue: '[1]',
      },
    },
    multiSelection: {
      type: 'toggle',
      displayName: 'Enable multiple selection',

      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  defaultSize: {
    width: 12,
    height: 80,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  events: {
    onClick: { displayName: 'On click' },
  },
  styles: {
    backgroundColor: {
      type: 'color',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
    },
    textColor: {
      type: 'color',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
    },
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
    borderRadius: {
      type: 'number',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: false,
      },
    },
    selectedTextColor: {
      type: 'color',
      displayName: 'Selected text colour',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
    selectedBackgroundColor: {
      type: 'color',
      displayName: 'Selected background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#007bff',
      },
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
    },
  },
  exposedVariables: {
    selected: [1],
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: `Button group` },
      defaultSelected: { value: '{{[1]}}' },
      values: { value: '{{[1,2,3]}}' },
      labels: { value: '{{[]}}' },
      multiSelection: { value: '{{false}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: '' },
      textColor: { value: '' },
      visibility: { value: '{{true}}' },
      borderRadius: { value: '{{4}}' },
      disabledState: { value: '{{false}}' },
      selectedTextColor: { value: '' },
      selectedBackgroundColor: { value: '' },
      padding: { value: 'default' },
    },
  },
};
