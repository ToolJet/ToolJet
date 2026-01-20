export const keyValuePairConfig = {
  name: 'KeyValuePair',
  displayName: 'Key Value Pair',
  description: 'Display data in key-value format',
  component: 'KeyValuePair',
  defaultSize: {
    width: 15,
    height: 800,
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
          "{{ { name: 'Olivia Nguyen', date: '15/05/2022', email: 'olivia.nguyen@example.com', website: 'oliviaexample.com', description: 'A passionate software developer with a knack for creating innovative solutions.',  mobile_number: 9876543210, categories: ['Reading', 'Traveling','Photography'], tags: 'Reading' , status: true } }}",
      },
      fields: {
        value: [
          {
            name: 'Name',
            key: 'name',
            id: 'e3ecbf7fa52c4d7210a93edb8f43776267a489bad52bd108be9588f790126737',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'string',
            visibility: true,
          },
          {
            name: 'Date',
            key: 'date',
            id: '27b75c8af9d34d1eaa1f9bb7f8f9f7b0abf1823e799748c8bb57e74f53b2c1dc',
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
            id: 'afc9a5091750a1bd4760e38760de3b4be11a43452ae8ae07ce2eebc569fe9a7f',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'link',
          },
          {
            name: 'Website',
            key: 'website',
            id: 'afc9a5091750a1bd4760e38760de3b4be11a43452ae8ae07ce2eebc569fe9a7f',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'link',
          },
          {
            name: 'Description',
            key: 'description',
            id: '5d2a3744a006388aadd012fcc15cc0dbcb5f9130e0fbb64c558561c97118754a',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'text',
          },
          {
            name: 'Categories',
            key: 'categories',
            id: 'f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a1',
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
            id: 'f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a1',
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
            id: '9c2e3c40572a4aefb8e179ee39a0e1ac9dc2b2e6634be56e1c05be13c3d1de56',
            autogenerated: true,
            fxActiveFields: [],
            fieldType: 'number',
          },
          {
            name: 'Status',
            key: 'status',
            id: '9c2e3c40572a4aefb8e179ee39a0e1ac9dc2b2e6634be56e1c05be13c3d1de56',
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
