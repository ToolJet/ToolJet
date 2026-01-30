export const keyValuePairConfig = {
  name: 'KeyValuePair',
  displayName: 'Key Value Pair',
  description: 'Display data in key-value format',
  component: 'KeyValuePair',
  defaultSize: {
    width: 10,
    height: 450,
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
      validation: {
        schema: {
          type: 'object',
        },
        defaultValue: "[{ id: 1, name: 'Sarah', email: 'sarah@mail.com' }]",
      },
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
    fieldDynamicData: {
      type: 'code',
      displayName: 'Field data',
      validation: {
        schema: { type: 'object' },
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
  events: {
    onSaveKeyValuePairChanges: { displayName: 'Save changes' },
  },
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
          "{{ { name: 'Olivia Nguyen', date: '15/05/2022', email: 'olivia.nguyen@example.com', website: 'oliviaexample.com', description: 'A passionate software developer with a knack for creating innovative solutions.',  mobile_number: 9876543210, categories: ['Reading', 'Traveling','Photography'], tags: 'Reading' , status: true } }}",
      },
      fields: {
        value: [
          {
            name: 'Name',
            key: 'name',
            id: 'ca231bf75648bf1de4dec17c55ee9e479e390725e8838da5ba15de8a3a1038e0',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'string',
            visibility: true,
          },
          {
            name: 'Date',
            key: 'date',
            id: '86662ab2979f5dee51324e0f633e9fe8436e26a4519e046a73db099e939e0e7a',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'datepicker',
            isTimeChecked: false,
            dateFormat: 'DD/MM/YYYY',
            parseDateFormat: 'DD/MM/YYYY',
            isDateSelectionEnabled: true,
          },
          {
            name: 'Email',
            key: 'email',
            id: '5a3f4a7aa34b0f5ad011e03651ce2adad842dd6c0cf45cc21af141d8258e529d',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'string',
          },
          {
            name: 'Website',
            key: 'website',
            id: 'af2899e427729627796a8142682585ca6cfae0603889152631eba13284b56072',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'link',
          },

          {
            name: 'Categories',
            key: 'categories',
            id: '624dddb3b5dcbf07065966f53b1fedbf8392dd4c4b42185192a2c1c5995f15ae',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'newMultiSelect',
            autoAssignColors: true,
            options: [
              {
                label: 'Reading',
                value: 'Reading',
              },
              {
                label: 'Traveling',
                value: 'Traveling',
              },
              {
                label: 'Photography',
                value: 'Photography',
              },
              {
                label: 'Music',
                value: 'Music',
              },
              {
                label: 'Cooking',
                value: 'Cooking',
              },
              {
                label: 'Crafting',
                value: 'Crafting',
              },
              {
                label: 'Volunteering',
                value: 'Volunteering',
              },
              {
                label: 'Gardening',
                value: 'Gardening',
              },
              {
                label: 'Dancing',
                value: 'Dancing',
              },
              {
                label: 'Hiking',
                value: 'Hiking',
              },
            ],
          },
          {
            name: 'Tags',
            key: 'tags',
            id: 'a26ccea171e28ca5091016ffe431167710d89b94132b3e60975526a8fe5ced3a',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'select',
            options: [
              {
                label: 'Reading',
                value: 'Reading',
              },
              {
                label: 'Traveling',
                value: 'Traveling',
              },
              {
                label: 'Photography',
                value: 'Photography',
              },
              {
                label: 'Music',
                value: 'Music',
              },
              {
                label: 'Cooking',
                value: 'Cooking',
              },
              {
                label: 'Crafting',
                value: 'Crafting',
              },
              {
                label: 'Volunteering',
                value: 'Volunteering',
              },
              {
                label: 'Gardening',
                value: 'Gardening',
              },
              {
                label: 'Dancing',
                value: 'Dancing',
              },
              {
                label: 'Hiking',
                value: 'Hiking',
              },
            ],
          },
          {
            name: 'Mobile Number',
            key: 'mobile_number',
            id: 'cda4d0efff55cdd487fd08c1a8ee79d94c8c78e17880e637473f8d894f99c559',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'number',
          },
          {
            name: 'Status',
            key: 'status',
            id: 'd3a586ad2990e589d23a9ebf8ea957ad7fe07d68fc5c1482364d1a589b6e03ec',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'boolean',
          },
        ],
      },
      useDynamicField: { value: '{{false}}' },
      fieldDynamicData: {
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
      alignment: { value: 'side' },
      direction: { value: 'left' },
      autoLabelWidth: { value: '{{false}}' },
      labelWidth: { value: '{{33}}' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      textColor: { value: 'var(--cc-primary-text)' },
      padding: { value: 'default' },
    },
  },
};
