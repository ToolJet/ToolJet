export const keyValuePairConfig = {
  name: 'KeyValuePair',
  displayName: 'Key Value Pair',
  description: 'Display data in key-value format',
  component: 'KeyValuePair',
  defaultSize: {
    width: 12,
    height: 300,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    dataSourceSelector: {
      type: 'dropdownMenu',
      displayName: 'Data source',
      options: [{ name: 'Raw JSON', value: 'rawJson' }],
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'object' }] } },
      newLine: true,
    },
    data: {
      type: 'code',
      displayName: ' ',
      validation: { schema: { type: 'object' } },
      conditionallyRender: {
        key: 'dataSourceSelector',
        value: 'rawJson',
      },
    },
    fields: {
      type: 'array',
      displayName: 'Fields',
    },
    useDynamicField: {
      type: 'toggle',
      displayName: 'Use dynamic field',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    fieldData: {
      type: 'code',
      displayName: 'Field data',
      validation: {
        schema: { type: 'array', element: { type: 'object' } },
        defaultValue:
          "[{name: 'First name', key: 'firstName', fieldType: 'string'}, {name: 'Last name', key: 'lastName', fieldType: 'string'}]",
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
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
      validation: { schema: { type: 'string' }, defaultValue: '' },
      section: 'additionalActions',
      placeholder: 'e.g., Enter your full name',
    },
  },
  events: {},
  styles: {
    // Label section
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Color',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'Label',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'top' },
      options: [
        { displayName: 'Top', value: 'top' },
        { displayName: 'Side', value: 'side' },
      ],
      accordian: 'Label',
    },
    direction: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'Label',
      isFxNotRequired: true,
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
    },
    autoLabelWidth: {
      type: 'checkbox',
      displayName: 'Width',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'Label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    labelWidth: {
      type: 'slider',
      showLabel: false,
      accordian: 'Label',
      conditionallyRender: [
        {
          key: 'alignment',
          value: 'side',
        },
        {
          key: 'autoLabelWidth',
          value: false,
        },
      ],
      isFxNotRequired: true,
    },
    // Values section
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-brand)' },
      accordian: 'Values',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'Values',
    },
    // Container section
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
    data: {},
    originalData: {},
    changedField: {},
    unsavedChanges: false,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'resetData',
      displayName: 'Reset data',
    },
    {
      handle: 'saveChanges',
      displayName: 'Save changes',
    },
    {
      handle: 'cancelChanges',
      displayName: 'Cancel changes',
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      dataSourceSelector: { value: 'rawJson' },
      data: {
        value:
          "{{ { firstName: 'John', lastName: 'Doe', email: 'john@example.com', website: 'https://example.com', role: 'Admin', teams: ['Engineering', 'Product'], enabled: true, createdAt: '2024-01-15' } }}",
      },
      fields: {
        value: [
          { name: 'First name', key: 'firstName', id: 'field-1', fieldType: 'string', isEditable: false },
          { name: 'Last name', key: 'lastName', id: 'field-2', fieldType: 'string', isEditable: true },
          { name: 'Email', key: 'email', id: 'field-3', fieldType: 'link', isEditable: true },
          { name: 'Website', key: 'website', id: 'field-4', fieldType: 'string' },
          { name: 'Text', key: 'text', id: 'field-5', fieldType: 'string' },
          { name: 'Role', key: 'role', id: 'field-6', fieldType: 'string' },
          { name: 'Teams', key: 'teams', id: 'field-7', fieldType: 'tags' },
          { name: 'Enabled', key: 'enabled', id: 'field-8', fieldType: 'boolean' },
          { name: 'Created at', key: 'createdAt', id: 'field-9', fieldType: 'datepicker' },
          { name: 'Id', key: 'id', id: 'field-10', fieldType: 'string', fieldVisibility: false },
        ],
      },
      useDynamicField: { value: '{{false}}' },
      fieldData: {
        value:
          "{{[{name: 'First name', key: 'firstName', fieldType: 'string'}, {name: 'Last name', key: 'lastName', fieldType: 'string'}]}}",
      },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      labelColor: { value: 'var(--cc-primary-text)' },
      alignment: { value: 'top' },
      direction: { value: 'left' },
      autoLabelWidth: { value: '{{true}}' },
      labelWidth: { value: '{{33}}' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      textColor: { value: 'var(--cc-primary-text)' },
      padding: { value: 'default' },
    },
  },
};
