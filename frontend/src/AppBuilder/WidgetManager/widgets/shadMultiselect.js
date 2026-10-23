export const shadMultiselectConfig = {
  name: 'ShadMultiselect',
  displayName: 'Multiselect',
  description:
    'Multi-select combobox: picked options show as removable chips in the field (+N past maxVisibleChips), with search and select all. options like the Combobox; defaultValue is an array of values; exposes values (array) and selectedOptions. Height: 64px with a label, 36px without (one row of chips; grows with dynamic height)',
  component: 'ShadMultiselect',
  defaultSize: {
    width: 10,
    height: 70,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    description: {
      type: 'code',
      displayName: 'Help text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    options: {
      type: 'optionsList',
      defaultParam: 'defaultValue',
      multipleDefaults: true,
      displayName: 'Options',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      note: "Labels that differ from values: {{[{ label: 'Draft', value: 'draft' }, { label: 'Live', value: 'live', disabled: true }]}}",
      placeholder: "['Draft', 'Live'] or [{ label, value, description?, icon?, group?, disabled? }]",
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Select',
      },
    },
    searchPlaceholder: {
      type: 'code',
      displayName: 'Search placeholder',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Search...',
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'No results text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'No results found.',
      },
    },
    showSearch: {
      type: 'toggle',
      displayName: 'Show search',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    serverSideSearch: {
      type: 'toggle',
      displayName: 'Server-side search (options already filtered by searchText)',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    showClearBtn: {
      type: 'toggle',
      displayName: 'Show clear button',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    optionsLoadingState: {
      type: 'toggle',
      displayName: 'Options loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default values',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
    },
    showSelectAll: {
      type: 'toggle',
      displayName: 'Show select all',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    maxVisibleChips: {
      minValue: 0,
      maxValue: 10000,
      type: 'code',
      displayName: 'Max visible chips (0 shows all)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
        defaultValue: 3,
      },
    },
    maxSelections: {
      minValue: 0,
      maxValue: 10000,
      type: 'code',
      displayName: 'Max selections (0 for no limit)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
        defaultValue: 0,
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  validation: {
    mandatory: {
      type: 'toggle',
      displayName: 'Make this field mandatory',
    },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: "{{components.text1.text === 'yes' || 'Enter yes'}}",
    },
  },
  events: {
    onSelect: {
      displayName: 'On select',
    },
    onSearchTextChanged: {
      displayName: 'On search text changed',
    },
    onFocus: {
      displayName: 'On focus',
    },
    onBlur: {
      displayName: 'On blur',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    helpTextColor: {
      type: 'colorSwatches',
      displayName: 'Help text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Field background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Field text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    placeholderColor: {
      type: 'colorSwatches',
      displayName: 'Placeholder color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Field border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (focus ring, checks)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    errorColor: {
      type: 'colorSwatches',
      displayName: 'Error color (message and border)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Field radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
      },
    },
    chipBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Chip background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    chipTextColor: {
      type: 'colorSwatches',
      displayName: 'Chip text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    menuBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Menu background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    menuTextColor: {
      type: 'colorSwatches',
      displayName: 'Menu text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    optionHoverColor: {
      type: 'colorSwatches',
      displayName: 'Highlighted option background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    isValid: true,
    isMandatory: false,
    values: [],
    selectedOptions: [],
    searchText: '',
    options: [],
    label: '',
  },
  actions: [
    {
      handle: 'selectOptions',
      displayName: 'Select options',
      params: [
        {
          handle: 'values',
          displayName: 'Values',
          defaultValue: '{{[]}}',
        },
      ],
    },
    {
      handle: 'deselectOptions',
      displayName: 'Deselect options',
      params: [
        {
          handle: 'values',
          displayName: 'Values',
          defaultValue: '{{[]}}',
        },
      ],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
    },
    {
      handle: 'setFocus',
      displayName: 'Set focus',
    },
    {
      handle: 'setBlur',
      displayName: 'Set blur',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      label: {
        value: 'Teams',
      },
      description: {
        value: '',
      },
      options: {
        value:
          "{{[{ label: 'Design', value: 'design' }, { label: 'Engineering', value: 'engineering' }, { label: 'Marketing', value: 'marketing' }, { label: 'Sales', value: 'sales' }, { label: 'Support', value: 'support' }]}}",
      },
      placeholder: {
        value: 'Select teams...',
      },
      searchPlaceholder: {
        value: 'Search teams...',
      },
      emptyText: {
        value: 'No team found.',
      },
      showSearch: {
        value: '{{true}}',
      },
      serverSideSearch: {
        value: '{{false}}',
      },
      showClearBtn: {
        value: '{{true}}',
      },
      optionsLoadingState: {
        value: '{{false}}',
      },
      defaultValue: {
        value: "{{['design', 'engineering']}}",
      },
      showSelectAll: {
        value: '{{true}}',
      },
      maxVisibleChips: {
        value: '{{3}}',
      },
      maxSelections: {
        value: '{{0}}',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    validation: {
      mandatory: {
        value: '{{false}}',
      },
      customRule: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
