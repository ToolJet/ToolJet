export const datepickerV2Config = {
  name: 'Datepicker',
  displayName: 'Date Picker',
  description: 'Choose date and time',
  component: 'DatepickerV2',
  defaultSize: {
    width: 12,
    height: 43,
  },
  validation: {
    customRule: { type: 'code', displayName: 'Custom validation' },
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
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'string' },
        defaultValue: '01/01/2022',
      },
    },
  },
  events: {
    onSelect: { displayName: 'On select' },
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
      validation: { schema: { type: 'string' }, defaultValue: '#DFE3E6' },
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
      validation: { schema: { type: 'string' }, defaultValue: '#11181C' },
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
        defaultValue: '#FFFFFF',
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
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: '14' },
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
      customRule: { value: '' },
    },
    properties: {
      label: { value: 'Label' },
      defaultValue: { value: '01/01/2022' },
    },
    events: [],
    styles: {
      labelColor: { value: '#1B1F24' },
      alignment: { value: 'top' },
      direction: { value: 'left' },
      labelWidth: { value: '20' },
      auto: { value: '{{true}}' },
      fieldBackgroundColor: { value: '#fff' },
      fieldBorderColor: { value: '#DFE3E6' },
      accentColor: { value: '#4368E3' },
      selectedTextColor: { value: '#11181C' },
      errTextColor: { value: '#E54D2E' },
      icon: { value: 'IconHome2' },
      iconVisibility: { value: false }, //Test
      iconDirection: { value: 'left' },
      fieldBorderRadius: { value: '{{14}}' },
      boxShadow: { value: '0px 0px 0px 0px #121212' },
      padding: { value: 'default' },
    },
  },
};
