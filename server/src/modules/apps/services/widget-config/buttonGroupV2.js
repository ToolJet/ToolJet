export const buttonGroupV2Config = {
  name: 'ButtonGroup',
  displayName: 'Button Group',
  description: 'Group of buttons',
  component: 'ButtonGroupV2',
  properties: {
    label: {
      type: 'code',
      displayName: 'Button group label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Label',
      },
    },
    advanced: {
      type: 'toggle',
      displayName: 'Mapped button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
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
    multiSelection: {
      type: 'toggle',
      displayName: 'Enable multiple selection',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Options',
    },
    layout: {
      type: 'select',
      displayName: 'Layout',
      options: [
        { name: 'Row', value: 'row' },
        { name: 'Column', value: 'column' },
        { name: 'Wrap', value: 'wrap' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'row',
      },
      accordian: 'Options',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
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
      validation: { schema: { type: 'boolean' }, defaultValue: false },
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
  defaultSize: {
    width: 12,
    height: 80,
  },
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
  events: {
    onClick: { displayName: 'On click' },
  },
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
    auto: {
      type: 'checkbox',
      displayName: 'Width',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    labelWidth: {
      type: 'slider',
      showLabel: false,
      accordian: 'label',
      conditionallyRender: [
        {
          key: 'alignment',
          value: 'side',
        },
        {
          key: 'auto',
          value: false,
        },
      ],
      isFxNotRequired: true,
    },
    widthType: {
      type: 'select',
      showLabel: false,
      options: [
        { name: 'Of the Component', value: 'ofComponent' },
        { name: 'Of the Field', value: 'ofField' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'ofComponent',
      },
      accordian: 'label',
      isFxNotRequired: true,
      conditionallyRender: [
        {
          key: 'alignment',
          value: 'side',
        },
        {
          key: 'auto',
          value: false,
        },
      ],
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'Buttons',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-default-border)',
      },
      accordian: 'Buttons',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-text)',
      },
      accordian: 'Buttons',
    },
    textSize: {
      type: 'numberInput',
      displayName: 'Font size',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 14,
      },
      accordian: 'Buttons',
    },
    fontWeight: {
      type: 'select',
      displayName: 'Font Weight',
      options: [
        { name: 'normal', value: 'normal' },
        { name: 'medium', value: 'medium' },
        { name: 'bold', value: 'bold' },
        { name: 'lighter', value: 'lighter' },
        { name: 'bolder', value: 'bolder' },
      ],
      accordian: 'Buttons',
    },
    contentAlignment: {
      type: 'alignButtons',
      displayName: 'Content alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'center',
      },
      accordian: 'Buttons',
    },
    hoverBackgroundMode: {
      type: 'switch',
      displayName: 'Hover background',
      validation: { schema: { type: 'string' }, defaultValue: 'auto' },
      options: [
        { displayName: 'Auto', value: 'auto' },
        { displayName: 'Manual', value: 'manual' },
      ],
      accordian: 'Container',
      isFxNotRequired: true,
    },
    hoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: '',
      showLabel: false,
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      conditionallyRender: {
        key: 'hoverBackgroundMode',
        value: 'manual',
      },
      accordian: 'Container',
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-default-icon)',
      },
      accordian: 'Buttons',
    },
    selectedBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Selected background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
      accordian: 'Buttons',
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Selected text',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#FFFFFF',
      },
      accordian: 'Buttons',
    },
    selectedIconColor: {
      type: 'colorSwatches',
      displayName: 'Selected icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#FFFFFF',
      },
      accordian: 'Buttons',
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-error-systemStatus)' },
      accordian: 'Buttons',
    },
    borderRadius: {
      type: 'number',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: false,
      },
      accordian: 'Buttons',
    },
    btnAlignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'left',
      },
      accordian: 'Buttons',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      conditionallyRender: {
        key: 'buttonType',
        value: 'primary',
      },
      accordian: 'Buttons',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'Container',
    },
  },
  exposedVariables: {
    selected: [1],
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setSelected',
      displayName: 'Select option',
      params: [{ handle: 'selected', displayName: 'Value' }],
    },
    {
      handle: 'clear',
      displayName: 'Clear selected options',
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
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
      label: { value: `Label` },
      advanced: { value: '{{false}}' },
      schema: {
        value:
          '{{[{"label":"Button1","value":"1","icon":"IconBolt", "iconVisibility":false, "disable":false,"default":true},{"label":"Button2","value":"2","icon":"IconBulb", "iconVisibility":false, "disable":false,"default":false},{"label":"Button3","value":"3","icon":"IconTag", "iconVisibility":false, "disable":false,"default":false}]}}',
      },
      options: {
        value: [
          {
            label: 'Button1',
            value: '1',
            icon: { value: 'IconBolt' },
            iconVisibility: false,
            disable: { value: false },
            default: { value: true },
          },
          {
            label: 'Button2',
            value: '2',
            icon: { value: 'IconBulb' },
            iconVisibility: false,
            disable: { value: false },
            default: { value: false },
          },
          {
            label: 'Button3',
            value: '3',
            icon: { value: 'IconTag' },
            iconVisibility: false,
            disable: { value: false },
            default: { value: false },
          },
        ],
      },
      multiSelection: { value: '{{false}}' },
      layout: { value: 'row' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      labelColor: { value: 'var(--cc-primary-text)' },
      labelWidth: { value: '33' },
      auto: { value: '{{true}}' },
      direction: { value: 'left' },
      alignment: { value: 'side' },
      widthType: { value: 'ofComponent' },
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-default-border)' },
      textColor: { value: 'var(--cc-primary-text)' },
      textSize: { value: '{{14}}' },
      fontWeight: { value: 'normal' },
      contentAlignment: { value: 'center' },
      hoverBackgroundMode: { value: 'auto' },
      hoverBackgroundColor: { value: 'var(--cc-primary-brand)' },
      iconColor: { value: 'var(--cc-default-icon)' },
      errTextColor: { value: 'var(--cc-error-systemStatus)' },
      selectedBackgroundColor: { value: 'var(--cc-primary-brand)' },
      selectedTextColor: { value: '#FFFFFF' },
      selectedIconColor: { value: '#FFFFFF' },
      borderRadius: { value: '{{6}}' },
      btnAlignment: { value: 'left' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      padding: { value: 'default' },
    },
  },
};
