export const multiselectV2Config = {
  name: 'Multiselect',
  displayName: 'Multiselect',
  description: 'Multiple item selector',
  defaultSize: {
    width: 10,
    height: 40,
  },
  component: 'MultiselectV2',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  validation: {
    mandatory: { type: 'toggle', displayName: 'Make this field mandatory' },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: `{{components.text2.text=='yes'&&'valid'}}`,
    },
  },
  actions: [
    {
      handle: 'selectOptions',
      displayName: 'Select Options',
      params: [
        {
          handle: 'option',
          displayName: 'Option',
        },
      ],
    },
    {
      handle: 'deselectOptions',
      displayName: 'Deselect Options',
      params: [
        {
          handle: 'option',
          displayName: 'Option',
        },
      ],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
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
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
  ],
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Label',
      },
      accordian: 'Data',
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select the options',
      },
      accordian: 'Data',
    },
    advanced: {
      type: 'toggle',
      displayName: 'Dynamic options',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Options',
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
    showAllOption: {
      type: 'toggle',
      displayName: 'Enable select all option',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      accordian: 'Options',
    },
    showAllSelectedLabel: {
      type: 'toggle',
      displayName: 'Show "All items are selected"',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'Options',
    },
    optionsLoadingState: {
      type: 'toggle',
      displayName: 'Options loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      accordian: 'Options',
    },
    sort: {
      type: 'switch',
      displayName: 'Sort options',
      validation: { schema: { type: 'string' }, defaultValue: 'asc' },
      options: [
        { displayName: 'None', value: 'none' },
        { displayName: 'a-z', value: 'asc' },
        { displayName: 'z-a', value: 'desc' },
      ],
      accordian: 'Options',
      isFxNotRequired: true,
    },
    showClearBtn: {
      type: 'toggle',
      displayName: 'Show clear selection button',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    showSearchInput: {
      type: 'toggle',
      displayName: 'Show search in options',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
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
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: '' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onSelect: { displayName: 'On select' },
    onSearchTextChanged: { displayName: 'On search text changed' },
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
  },

  styles: {
    labelColor: {
      type: 'color',
      displayName: 'Color',
      validation: { schema: { type: 'string' }, defaultValue: '#1B1F24' },
      accordian: 'label',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'side' },
      options: [
        { displayName: 'Side', value: 'side' },
        { displayName: 'Top', value: 'top' },
      ],
      accordian: 'label',
    },
    direction: {
      type: 'switch',
      displayName: 'Direction',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'label',
      isFxNotRequired: true,
    },
    labelWidth: {
      type: 'slider',
      displayName: 'Width',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    auto: {
      type: 'checkbox',
      displayName: 'auto',
      showLabel: false,
      validation: { schema: { type: 'boolean' } },
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },

    fieldBackgroundColor: {
      type: 'color',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: '#fff' },
      accordian: 'field',
    },

    fieldBorderColor: {
      type: 'color',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: '#CCD1D5' },
      accordian: 'field',
    },
    accentColor: {
      type: 'color',
      displayName: 'Accent',
      validation: { schema: { type: 'string' }, defaultValue: '#4368E3' },
      accordian: 'field',
    },
    selectedTextColor: {
      type: 'color',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: '#1B1F24' },
      accordian: 'field',
    },
    errTextColor: {
      type: 'color',
      displayName: 'Error Text',
      validation: { schema: { type: 'string' }, defaultValue: '#D72D39' },
      accordian: 'field',
    },
    icon: {
      type: 'icon',
      displayName: 'Icon',
      validation: { schema: { type: 'string' }, defaultValue: 'IconHome2' },
      accordian: 'field',
      visibility: false,
    },
    iconColor: {
      type: 'color',
      displayName: 'Icon color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#6A727C',
      },
      accordian: 'field',
      showLabel: false,
    },
    fieldBorderRadius: {
      type: 'input',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: '6' },
      accordian: 'field',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000090',
      },
      accordian: 'field',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
  },
  exposedVariables: {
    searchText: '',
  },

  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    validation: {
      mandatory: { value: false },
      customRule: { value: null },
    },
    properties: {
      label: { value: 'Select' },
      values: { value: ['1', '2'] },
      advanced: { value: `{{false}}` },
      showAllOption: { value: '{{false}}' },
      optionsLoadingState: { value: '{{false}}' },
      sort: { value: 'asc' },
      placeholder: { value: 'Select the options' },
      showAllSelectedLabel: { value: '{{true}}' },
      showClearBtn: { value: '{{true}}' },
      showSearchInput: { value: '{{true}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      schema: {
        value:
          "{{[\t{label: 'option1',value: 1,disable: false,visible: true,default: true},{label: 'option2',value: 2,disable: false,visible: true},{label: 'option3',value: 3,disable: false,visible: true}\t]}}",
      },
      options: {
        value: [
          {
            label: 'option1',
            value: '1',
            disable: { value: false },
            visible: { value: true },
            default: { value: false },
          },
          {
            label: 'option2',
            value: '2',
            disable: { value: false },
            visible: { value: true },
            default: { value: true },
          },
          {
            label: 'option3',
            value: '3',
            disable: { value: false },
            visible: { value: true },
            default: { value: false },
          },
        ],
      },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      labelColor: { value: '#1B1F24' },
      labelWidth: { value: '33' },
      auto: { value: '{{true}}' },
      fieldBorderRadius: { value: '6' },
      selectedTextColor: { value: '#1B1F24' },
      fieldBorderColor: { value: '#CCD1D5' },
      errTextColor: { value: '#D72D39' },
      fieldBackgroundColor: { value: '#fff' },
      direction: { value: 'left' },
      alignment: { value: 'side' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      icon: { value: 'IconHome2' },
      iconVisibility: { value: false },
      iconColor: { value: '#6A727C' },
      accentColor: { value: '#4368E3' },
    },
  },
};
