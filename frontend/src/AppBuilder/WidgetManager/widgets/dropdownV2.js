export const dropdownV2Config = {
  name: 'Dropdown',
  displayName: 'Dropdown',
  description: 'Single item selector',
  defaultSize: {
    width: 10,
    height: 40,
  },
  component: 'DropdownV2',
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
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select',
      },
      accordian: 'Data',
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select an option',
      },
      accordian: 'Data',
    },
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
    optionsLoadingState: {
      type: 'toggle',
      displayName: 'Options loading state',
      validation: {
        schema: { type: 'boolean' },
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
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Enter tooltip text',
      },
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
      type: 'colorSwatches',
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
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: '#fff' },
      accordian: 'field',
    },
    fieldBorderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: '#CCD1D5' },
      accordian: 'field',
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-brand)' },
      accordian: 'field',
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: '#1B1F24' },
      accordian: 'field',
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error text',
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
      type: 'colorSwatches',
      displayName: '',
      showLabel: false,
      validation: {
        schema: { type: 'string' },
        defaultValue: '#6A727C',
      },
      accordian: 'field',
    },
    fieldBorderRadius: {
      type: 'input',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: '6' },
      accordian: 'field',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
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
    label: 'Select',
  },
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select option',
      params: [{ handle: 'select', displayName: 'Select' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
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
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    validation: {
      mandatory: { value: '{{false}}' },
      customRule: { value: null },
    },
    properties: {
      advanced: { value: `{{false}}` },
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
      label: { value: 'Select' },
      optionsLoadingState: { value: '{{false}}' },
      sort: { value: 'asc' },
      placeholder: { value: 'Select an option' },
      showClearBtn: { value: '{{true}}' },
      showSearchInput: { value: '{{true}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
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
      accentColor: { value: 'var(--cc-primary-brand)' },
    },
  },
};
