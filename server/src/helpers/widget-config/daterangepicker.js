export const daterangepickerConfig = {
  name: 'DateRangePicker',
  displayName: 'Range Picker',
  description: 'Choose date ranges',
  component: 'DaterangePicker',
  defaultSize: {
    width: 10,
    height: 40,
  },
  validation: {
    minDate: {
      type: 'datepicker',
      placeholder: 'MM/DD/YYYY',
      displayName: 'Min Date',
    },
    maxDate: {
      type: 'datepicker',
      placeholder: 'MM/DD/YYYY',
      displayName: 'Max Date',
    },
    disabledDates: {
      type: 'code',
      displayName: 'Disabled dates',
      validation: {
        schema: { type: 'array', element: { type: 'string' } },
        defaultValue: "['01/01/2022']",
      },
    },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
    },
    mandatory: {
      type: 'toggle',
      displayName: 'Make this field mandatory',
    },
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
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
    defaultStartDate: {
      type: 'code',
      displayName: 'Default start date',
      validation: {
        schema: {
          type: 'string',
        },
        defautlValue: '01/04/2022',
      },
    },
    defaultEndDate: {
      type: 'code',
      displayName: 'Default end date',
      validation: {
        schema: {
          type: 'string',
        },
        defautlValue: '10/04/2022',
      },
    },
    format: {
      type: 'code',
      displayName: 'Format',
      validation: {
        schema: {
          type: 'string',
        },
        defautlValue: 'DD/MM/YYYY',
      },
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
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
  },
  actions: [
    {
      handle: 'setStartDate',
      displayName: 'Set Start Date',
      params: [
        { handle: 'value', displayName: 'Value' },
        { handle: 'format', displayName: 'Format' },
      ],
    },
    {
      handle: 'clearStartDate',
      displayName: 'Clear Start Date',
    },
    {
      handle: 'setEndDate',
      displayName: 'Set End Date',
      params: [
        { handle: 'value', displayName: 'Value' },
        { handle: 'format', displayName: 'Format' },
      ],
    },
    {
      handle: 'clearEndDate',
      displayName: 'Clear End Date',
    },
    {
      handle: 'setDateRange',
      displayName: 'Set Date Range',
      params: [
        { handle: 'startDate', displayName: 'Start Date' },
        { handle: 'endDate', displayName: 'End Date' },
        { handle: 'format', displayName: 'Format' },
      ],
    },
    {
      handle: 'clearDateRange',
      displayName: 'Clear Date Range',
    },
    {
      handle: 'setDisabledDates',
      displayName: 'Set disabled dates',
      params: [{ handle: 'value', displayName: 'Value' }],
    },
    {
      handle: 'clearDisabledDates',
      displayName: 'Clear disabled dates',
    },
    {
      handle: 'setMinDate',
      displayName: 'Set min date',
      params: [{ handle: 'value', displayName: 'Value' }],
    },
    {
      handle: 'setMaxDate',
      displayName: 'Set max date',
      params: [{ handle: 'value', displayName: 'Value' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'setFocus',
      displayName: 'Set focus',
    },
    {
      handle: 'setBlur',
      displayName: 'Set blur',
    },
  ],
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
      validation: { schema: { type: 'string' }, defaultValue: 'top' },
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
      displayName: 'Error text',
      validation: { schema: { type: 'string' }, defaultValue: '#E54D2E' },
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
      displayName: '',
      showLabel: false,
      validation: {
        schema: { type: 'string' },
        defaultValue: '#6A727C',
      },
      accordian: 'field',
    },
    iconDirection: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' } },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'field',
    },
    borderRadius: {
      type: 'input',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'field',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #121212',
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
    endDate: '',
    startDate: '',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Label' },
      defaultStartDate: { value: '01/04/2022' },
      defaultEndDate: { value: '10/04/2022' },
      format: { value: 'DD/MM/YYYY' },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    validation: {
      minDate: { value: '' },
      maxDate: { value: '' },
      disabledDates: { value: '{{[]}}' },
      customRule: { value: '' },
      mandatory: { value: '{{false}}' },
    },
    events: [],
    styles: {
      labelColor: { value: '#1B1F24' },
      alignment: { value: 'side' },
      direction: { value: 'left' },
      labelWidth: { value: '20' },
      auto: { value: '{{true}}' },
      fieldBackgroundColor: { value: '#fff' },
      fieldBorderColor: { value: '#CCD1D5' },
      accentColor: { value: '#4368E3' },
      selectedTextColor: { value: '#1B1F24' },
      errTextColor: { value: '#E54D2E' },
      icon: { value: 'IconCalendarMonth' },
      iconVisibility: { value: true },
      iconDirection: { value: 'left' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #121212' },
      padding: { value: 'default' },
      iconColor: { value: '#6A727C' },
    },
  },
};
