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
    customRule: { type: 'code', displayName: 'Custom validation' },
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
      },
      accordian: 'Data',
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        validation: {
          schema: { type: 'string' },
        },
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
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
      validation: {
        schema: { type: 'boolean' },
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
        },
      },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
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
      validation: { schema: { type: 'string' } },
      accordian: 'label',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' } },
      options: [
        { displayName: 'Side', value: 'side' },
        { displayName: 'Top', value: 'top' },
      ],
      accordian: 'label',
    },
    direction: {
      type: 'switch',
      displayName: 'Direction',
      validation: { schema: { type: 'string' } },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'label',
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
    },

    fieldBackgroundColor: {
      type: 'color',
      displayName: 'Background',
      validation: { schema: { type: 'string' } },
      accordian: 'field',
    },

    fieldBorderColor: {
      type: 'color',
      displayName: 'Border',
      validation: { schema: { type: 'string' } },
      accordian: 'field',
    },
    accentColor: {
      type: 'color',
      displayName: 'Accent',
      validation: { schema: { type: 'string' } },
      accordian: 'field',
    },
    selectedTextColor: {
      type: 'color',
      displayName: 'Text',
      validation: { schema: { type: 'string' } },
      accordian: 'field',
    },
    errTextColor: {
      type: 'color',
      displayName: 'Error Text',
      validation: { schema: { type: 'string' } },
      accordian: 'field',
    },
    icon: {
      type: 'icon',
      displayName: 'Icon',
      validation: { schema: { type: 'string' } },
      accordian: 'field',
      visibility: false,
    },
    iconColor: {
      type: 'color',
      displayName: 'Icon color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'field',
      showLabel: false,
    },
    fieldBorderRadius: {
      type: 'input',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'field',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'field',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
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
      // value: { value: '{{["1","2"]}}' },
      values: { value: '{{["1","2"]}}' },
      advanced: { value: `{{false}}` },
      showAllOption: { value: '{{false}}' },
      optionsLoadingState: { value: '{{false}}' },
      placeholder: { value: 'Select the options' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      schema: {
        value:
          "{{[\t{label: 'option1',value: '1',disable: false,visible: true,default: true},{label: 'option2',value: '2',disable: false,visible: true},{label: 'option3',value: '3',disable: false,visible: true}\t]}}",
      },
      options: {
        value:
          "{{[\t{label: 'option1',value: '1',disable: false,visible: true,default: true},{label: 'option2',value: '2',disable: false,visible: true},{label: 'option3',value: '3',disable: false,visible: true}\t]}}",
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
