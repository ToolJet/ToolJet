export const tagsInputConfig = {
  name: 'TagsInput',
  displayName: 'Tags Input',
  description: 'Tag input with create, select, and delete functionality',
  defaultSize: {
    width: 10,
    height: 40,
  },
  component: 'TagsInput',
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
      handle: 'selectTags',
      displayName: 'Select Tags',
      params: [
        {
          handle: 'tags',
          displayName: 'Tags',
        },
      ],
    },
    {
      handle: 'deselectTags',
      displayName: 'Deselect Tags',
      params: [
        {
          handle: 'tags',
          displayName: 'Tags',
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
        defaultValue: 'Add or select a tag',
      },
      accordian: 'Data',
    },
    advanced: {
      type: 'toggle',
      displayName: 'Dynamic tags',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Tags',
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
      accordian: 'Tags',
    },
    schema: {
      type: 'code',
      displayName: 'Schema',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
      accordian: 'Tags',
    },
    sort: {
      type: 'switch',
      displayName: 'Sort tags',
      validation: { schema: { type: 'string' }, defaultValue: 'none' },
      options: [
        { displayName: 'None', value: 'none' },
        { displayName: 'a-z', value: 'asc' },
        { displayName: 'z-a', value: 'desc' },
      ],
      accordian: 'Tags',
      isFxNotRequired: true,
    },
    allowNewTags: {
      type: 'toggle',
      displayName: 'Allow new tags',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Tags',
    },
    optionsLoadingState: {
      type: 'toggle',
      displayName: 'Tags loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Tags',
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    enableSearch: {
      type: 'toggle',
      displayName: 'Turn on search',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      accordian: 'Tags',
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
  events: {
    onTagAdded: { displayName: 'On tag added' },
    onTagDeleted: { displayName: 'On tag deleted' },
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
    autoPickChipColor: {
      type: 'checkbox',
      displayName: 'Auto pick chip color',
      checkboxLabel: 'Auto color',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'field',
      isFxNotRequired: true,
    },
    tagBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Chip color',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface3-surface)' },
      accordian: 'field',
      conditionallyRender: {
        key: 'autoPickChipColor',
        value: false,
      },
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Text color',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'field',
      conditionallyRender: {
        key: 'autoPickChipColor',
        value: false,
      },
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-error-systemStatus)' },
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
      displayName: 'Box Shadow',
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
    values: [],
    tags: [],
    newTagsAdded: [],
    selectedTags: [],
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
      label: { value: 'Tags' },
      values: { value: [] },
      advanced: { value: `{{false}}` },
      allowNewTags: { value: '{{true}}' },
      sort: { value: 'none' },
      optionsLoadingState: { value: '{{false}}' },
      placeholder: { value: 'Add or select a tag' },
      dynamicHeight: { value: '{{true}}' },
      enableSearch: { value: '{{true}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      schema: {
        value:
          "{{[\t{label: 'Newport',value: 'newport',visible: true,default: false, disable:false},{label: 'New York',value: 'new_york',visible: true,default: false, disable:false},{label: 'San Clemente',value: 'san_clemente',visible: true,default: false, disable:false}\t]}}",
      },
      options: {
        value: [
          {
            label: 'Newport',
            value: 'newport',
            visible: { value: true },
            default: { value: false },
          },
          {
            label: 'New York',
            value: 'new_york',
            visible: { value: true },
            default: { value: false },
          },
          {
            label: 'San Clemente',
            value: 'san_clemente',
            visible: { value: true },
            default: { value: false },
          },
        ],
      },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      labelColor: { value: 'var(--cc-primary-text)' },
      labelWidth: { value: '33' },
      auto: { value: '{{true}}' },
      fieldBorderRadius: { value: '6' },
      selectedTextColor: { value: 'var(--cc-primary-text)' },
      fieldBorderColor: { value: 'var(--cc-default-border)' },
      errTextColor: { value: 'var(--cc-error-systemStatus)' },
      fieldBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      autoPickChipColor: { value: '{{true}}' },
      tagBackgroundColor: { value: 'var(--cc-surface3-surface)' },
      direction: { value: 'left' },
      alignment: { value: 'side' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      widthType: { value: 'ofComponent' },
    },
  },
};
