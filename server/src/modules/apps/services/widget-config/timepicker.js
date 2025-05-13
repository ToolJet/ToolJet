export const timePickerConfig = {
  name: 'TimePicker',
  displayName: 'Time Picker',
  description: 'Choose date and time',
  component: 'TimePicker',
  defaultSize: {
    width: 10,
    height: 40,
  },
  validation: {
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
      section: 'Date',
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'string' },
        defaultValue: '00:00',
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
      handle: 'setTime',
      displayName: 'Set time',
      params: [
        { handle: 'value', displayName: 'Value' },
        { handle: 'format', displayName: 'Format' },
      ],
    },
    {
      handle: 'setValueInTimestamp',
      displayName: 'Set value in timestamp',
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
      type: 'colorSwatches',
      displayName: 'Color',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
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
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
      accordian: 'field',
    },
    fieldBorderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-default-border)' },
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
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'field',
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-error-systemStatus)' },
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
      minTime: { value: '' },
      maxTime: { value: '' },
      customRule: { value: '' },
      mandatory: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Label' },
      defaultValue: { value: '00:00' },
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
      labelColor: { value: 'var(--cc-primary-text)' },
      alignment: { value: 'side' },
      direction: { value: 'left' },
      labelWidth: { value: '20' },
      auto: { value: '{{true}}' },
      fieldBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      fieldBorderColor: { value: 'var(--cc-default-border)' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      selectedTextColor: { value: 'var(--cc-primary-text)' },
      errTextColor: { value: 'var(--cc-error-systemStatus)' },
      icon: { value: 'IconClock' },
      iconVisibility: { value: true },
      iconDirection: { value: 'left' },
      fieldBorderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #121212' },
      padding: { value: 'default' },
      iconColor: { value: '#6A727C' },
    },
  },
};
