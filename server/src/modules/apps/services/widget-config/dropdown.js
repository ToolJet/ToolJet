export const dropdownConfig = {
  name: 'DropdownLegacy',
  displayName: 'Dropdown (Legacy)',
  description: 'Single item selector',
  defaultSize: {
    width: 8,
    height: 30,
  },
  component: 'DropDown',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  validation: {
    customRule: { type: 'code', displayName: 'Custom validation' },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select',
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',

      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select an option',
      },
    },
    advanced: {
      type: 'toggle',
      displayName: 'Advanced',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    value: {
      type: 'code',
      displayName: 'Default value',
      conditionallyRender: {
        key: 'advanced',
        value: false,
      },
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
        },
        defaultValue: 2,
      },
    },
    values: {
      type: 'code',
      displayName: 'Option values',
      conditionallyRender: {
        key: 'advanced',
        value: false,
      },
      validation: {
        schema: {
          type: 'array',
          element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
        },
        defaultValue: "['one', 'two', 'three']",
      },
    },
    display_values: {
      type: 'code',
      displayName: 'Option labels',
      conditionallyRender: {
        key: 'advanced',
        value: false,
      },
      validation: {
        schema: {
          type: 'array',
          element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
        },
        defaultValue: "['one', 'two', 'three']",
      },
    },

    schema: {
      type: 'code',
      displayName: 'Schema',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Options loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {
    onSelect: { displayName: 'On select' },
    onSearchTextChanged: { displayName: 'On search text changed' },
  },
  styles: {
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'number' }, { type: 'string' }],
        },
        defaultValue: 4,
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
      },
      defaultValue: true,
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Selected text color',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '#000000',
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    justifyContent: {
      type: 'alignButtons',
      displayName: 'Align Text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'left',
      },
    },
  },
  exposedVariables: {
    value: 2,
    searchText: '',
    label: 'Select',
    optionLabels: ['one', 'two', 'three'],
    selectedOptionLabel: 'two',
  },
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select option',
      params: [{ handle: 'select', displayName: 'Select' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    validation: {
      customRule: { value: null },
    },
    properties: {
      advanced: { value: `{{false}}` },
      schema: {
        value:
          "{{[\t{label: 'One',value: 1,disable: false,visible: true,default: true},{label: 'Two',value: 2,disable: false,visible: true},{label: 'Three',value: 3,disable: false,visible: true}\t]}}",
      },

      label: { value: 'Select' },
      value: { value: '{{2}}' },
      values: { value: '{{[1,2,3]}}' },
      display_values: { value: '{{["one", "two", "three"]}}' },
      loadingState: { value: '{{false}}' },
      placeholder: { value: 'Select an option' },
    },
    events: [],
    styles: {
      borderRadius: { value: '4' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      justifyContent: { value: 'left' },
    },
  },
};
