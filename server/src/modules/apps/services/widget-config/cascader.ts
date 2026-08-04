export const cascaderConfig = {
  name: 'Cascader',
  displayName: 'Cascader',
  description: 'Hierarchical single item selector',
  defaultSize: {
    width: 10,
    height: 40,
  },
  component: 'Cascader',
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

    value: {
      type: 'code',
      displayName: 'Default value',
       validation: {
        schema: { type: 'any' },
      },
      conditionallyRender: {
        key: 'advanced',
        value: false,
      },
      accordian: 'Options',
    },
    // Separator used to render the selected path in the input and in `pathString`.
    pathSeparator: {
      type: 'code',
      displayName: 'Path separator',
      validation: {
        schema: { type: 'string' },
        defaultValue: '/',
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
    data: {
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
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
      accordian: 'Options',
    },
    showClearBtn: {
      type: 'toggle',
      displayName: 'Show clear selection button',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
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
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    // Renders first in the Additional Actions section. Its displayName is the
    // visible "Tooltip" label for the whole pair; the `tooltip` code field below
    // hides its own label via showLabel:false so we don't get a duplicate.
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onSelect: { displayName: 'On select' },
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
  },
  styles: {
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Color',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'label',
    },
    labelFontSize: {
      type: 'numberInput',
      displayName: 'Size',
      validation: { schema: { type: 'number' }, defaultValue: 12 },
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
    placeholderTextColor: {
      type: 'colorSwatches',
      displayName: 'Placeholder Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-placeholder-text)' },
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
        defaultValue: 'var(--cc-default-icon)',
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
    menuWidthMode: {
      type: 'select',
      displayName: 'Menu width',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'matchField',
      },
      options: [
        { name: 'Match the field', value: 'matchField' },
        { name: 'Match the content', value: 'matchContent' },
        { name: 'Custom', value: 'custom' },
      ],
      accordian: 'field',
      isFxNotRequired: true,
      description: 'Control dropdown menu width: match field, match content, or set custom.',
    },
    menuCustomWidth: {
      type: 'input',
      displayName: 'Custom menu width',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
      },
      conditionallyRender: {
        key: 'menuWidthMode',
        value: 'custom',
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
    value: null,
    label: '',
    selectedOption: null,
    pathArray: [],
    pathLabels: [],
    pathString: '',
    isLoading: false,
    isOptionsLoading: false,
    isVisible: true,
    isDisabled: false,
    isValid: true,
    isMandatory: false,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'Value', type: 'code' }],
    },
    {
      handle: 'clearValue',
      displayName: 'Clear value',
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setOptionsLoading',
      displayName: 'Set options loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'visibility', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
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
      label: { value: 'Select' },
      placeholder: { value: 'Select an option' },
      value: { value: '' },
      pathSeparator: { value: '/' },
      advanced: { value: '{{false}}' },
      data: {
        value:
          '{{[{"label":"Asia","value":"asia","children":[{"label":"China","value":"china","children":[{"label":"Beijing","value":"beijing"},{"label":"Shanghai","value":"shanghai"}]},{"label":"Japan","value":"japan"},{"label":"India","value":"india","children":[{"label":"Delhi","value":"delhi"},{"label":"Mumbai","value":"mumbai"},{"label":"Bengaluru","value":"bengaluru"}]}]},{"label":"Europe","value":"europe","children":[{"label":"France","value":"france"},{"label":"Spain","value":"spain"},{"label":"England","value":"england"}]},{"label":"Africa","value":"africa"}]}}',
      },
      optionsLoadingState: { value: '{{false}}' },
      showClearBtn: { value: '{{true}}' },
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
      tooltipFormat: { value: 'plainText' },
      options: {
        value: [
          {
            label: 'Asia',
            value: 'asia',
            visible: { value: true },
            disable: { value: false },
            children: [
              {
                label: 'China',
                value: 'china',
                visible: { value: true },
                disable: { value: false },
                children: [
                  { label: 'Beijing', value: 'beijing', visible: { value: true }, disable: { value: false } },
                  { label: 'Shanghai', value: 'shanghai', visible: { value: true }, disable: { value: false } },
                ],
              },
              { label: 'Japan', value: 'japan', visible: { value: true }, disable: { value: false } },
              {
                label: 'India',
                value: 'india',
                visible: { value: true },
                disable: { value: false },
                children: [
                  { label: 'Delhi', value: 'delhi', visible: { value: true }, disable: { value: false } },
                  { label: 'Mumbai', value: 'mumbai', visible: { value: true }, disable: { value: false } },
                  { label: 'Bengaluru', value: 'bengaluru', visible: { value: true }, disable: { value: false } },
                ],
              },
            ],
          },
          {
            label: 'Europe',
            value: 'europe',
            visible: { value: true },
            disable: { value: false },
            children: [
              { label: 'France', value: 'france', visible: { value: true }, disable: { value: false } },
              { label: 'Spain', value: 'spain', visible: { value: true }, disable: { value: false } },
              { label: 'England', value: 'england', visible: { value: true }, disable: { value: false } },
            ],
          },
          { label: 'Africa', value: 'africa', visible: { value: true }, disable: { value: false } },
        ],
      },
    },
    events: [],
    styles: {
      labelColor: { value: 'var(--cc-primary-text)' },
      labelFontSize: { value: '{{12}}' },
      labelWidth: { value: '33' },
      auto: { value: '{{true}}' },
      fieldBorderRadius: { value: '6' },
      selectedTextColor: { value: 'var(--cc-primary-text)' },
      placeholderTextColor: { value: 'var(--cc-placeholder-text)' },
      fieldBorderColor: { value: 'var(--cc-default-border)' },
      errTextColor: { value: 'var(--cc-error-systemStatus)' },
      fieldBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      direction: { value: 'left' },
      alignment: { value: 'side' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      icon: { value: 'IconHome2' },
      iconVisibility: { value: false },
      iconColor: { value: 'var(--cc-default-icon)' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      widthType: { value: 'ofComponent' },
      menuWidthMode: { value: 'matchField' },
      menuCustomWidth: { value: '256' },
    },
  },
};
