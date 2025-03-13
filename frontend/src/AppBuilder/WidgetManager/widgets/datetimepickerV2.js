export const datetimePickerV2Config = {
  name: 'DatetimePicker',
  version: 'v2',
  displayName: 'Datetime Picker',
  description: 'Choose date and time',
  component: 'DatetimePickerV2',
  defaultSize: {
    width: 10,
    height: 40,
  },
  validation: {
    minDate: {
      type: 'code',
      placeholder: 'DD/MM/YYYY',
      displayName: 'Min Date',
      dynamicType: 'date',
    },
    maxDate: {
      type: 'code',
      placeholder: 'DD/MM/YYYY',
      displayName: 'Max Date',
      dynamicType: 'date',
    },
    minTime: {
      type: 'code',
      placeholder: 'HH:mm',
      displayName: 'Min Time',
      dynamicType: 'time',
    },
    maxTime: {
      type: 'code',
      placeholder: 'HH:mm',
      displayName: 'Max Time',
      dynamicType: 'time',
    },
    disabledDates: {
      type: 'code',
      displayName: 'Disabled dates',
      // validation: {
      //   schema: { type: 'array', element: { type: 'string' } },
      //   defaultValue: "['01/01/2022']",
      // },
      dynamicType: 'arrayDate',
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
    isTimezoneEnabled: {
      type: 'toggle',
      displayName: 'Manage time zones',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'Data',
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'string' },
        defaultValue: '01/01/2022',
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
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        { handle: 'value', displayName: 'Value' },
        { handle: 'format', displayName: 'Format' },
      ],
    },
    {
      handle: 'clearValue',
      displayName: 'Clear value',
    },
    {
      handle: 'setDate',
      displayName: 'Set date',
      params: [
        { handle: 'date', displayName: 'Value' },
        { handle: 'format', displayName: 'Format' },
      ],
    },
    {
      handle: 'setTime',
      displayName: 'Set time',
      params: [
        { handle: 'time', displayName: 'Value' },
        { handle: 'format', displayName: 'Format' },
      ],
    },
    {
      handle: 'setValueInTimestamp',
      displayName: 'Set value in timestamp',
      params: [{ handle: 'value', displayName: 'Value' }],
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
      handle: 'setMinTime',
      displayName: 'Set min time',
      params: [{ handle: 'value', displayName: 'Value' }],
    },
    {
      handle: 'setMaxTime',
      displayName: 'Set max time',
      params: [{ handle: 'value', displayName: 'Value' }],
    },
    {
      handle: 'setDisplayTimezone',
      displayName: 'Set display timezone',
      params: [{ handle: 'value', displayName: 'Value' }],
    },
    {
      handle: 'setStoreTimezone',
      displayName: 'Set store timezone',
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
    fieldBorderRadius: {
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
    value: '',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    validation: {
      minDate: { value: '' },
      maxDate: { value: '' },
      minTime: { value: '' },
      maxTime: { value: '' },
      disabledDates: { value: '{{[]}}' },
      customRule: { value: '' },
      mandatory: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Label' },
      defaultValue: { value: '01/01/2022' },
      dateFormat: { value: 'DD/MM/YYYY' },
      timeFormat: { value: 'HH:mm' },
      isTimezoneEnabled: { value: '{{false}}' },
      displayTimezone: { value: 'UTC' },
      storeTimezone: { value: 'UTC' },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
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
      icon: { value: 'IconCalendarTime' },
      iconVisibility: { value: true },
      iconDirection: { value: 'left' },
      fieldBorderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #121212' },
      padding: { value: 'default' },
      iconColor: { value: '#6A727C' },
    },
  },
};
