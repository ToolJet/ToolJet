export const multiselectConfig = {
  name: 'MultiselectLegacy',
  displayName: 'Multiselect (Legacy)',
  description: 'Multiple item selector',
  defaultSize: {
    width: 12,
    height: 30,
  },
  component: 'Multiselect',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select Option',
      params: [
        {
          handle: 'option',
          displayName: 'Option',
        },
      ],
    },
    {
      handle: 'deselectOption',
      displayName: 'Deselect Option',
      params: [
        {
          handle: 'option',
          displayName: 'Option',
        },
      ],
    },
    {
      handle: 'clearSelections',
      displayName: 'Clear selections',
    },
  ],
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select',
      },
    },
    value: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        defaultValue: "['two', 'three']",
      },
    },
    values: {
      type: 'code',
      displayName: 'Option values',
      validation: {
        schema: { type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        defaultValue: "['one', 'two', 'three']",
      },
    },
    display_values: {
      type: 'code',
      displayName: 'Option labels',
      validation: {
        schema: { type: 'array', element: { type: 'string' } },
        defaultValue: "['one', 'two', 'three']",
      },
    },
    showAllOption: {
      type: 'toggle',
      displayName: 'Enable select All option',
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
        schema: { type: 'number' },
        defaultValue: 4,
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
  },
  exposedVariables: {
    values: {},
    searchText: '',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Select' },
      value: { value: '{{[2,3]}}' },
      values: { value: '{{[1,2,3]}}' },
      display_values: { value: '{{["one", "two", "three"]}}' },
      visible: { value: '{{true}}' },
      showAllOption: { value: '{{false}}' },
    },
    events: [],
    styles: {
      borderRadius: { value: '4' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
