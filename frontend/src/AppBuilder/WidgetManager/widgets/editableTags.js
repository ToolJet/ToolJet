export const editableTagsConfig = {
  name: 'EditableTags',
  displayName: 'Editable Tags',
  description: 'Tag input with create, select, and delete functionality',
  defaultSize: {
    width: 10,
    height: 40,
  },
  component: 'EditableTags',
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
    allowNewTags: {
      type: 'toggle',
      displayName: 'Allow new tags',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      accordian: 'Options',
    },
    caseEnforcement: {
      type: 'switch',
      displayName: 'Case enforcement',
      validation: { schema: { type: 'string' }, defaultValue: 'none' },
      options: [
        { displayName: 'None', value: 'none' },
        { displayName: 'Lowercase', value: 'lowercase' },
        { displayName: 'Uppercase', value: 'uppercase' },
      ],
      accordian: 'Options',
      isFxNotRequired: true,
      conditionallyRender: {
        key: 'allowNewTags',
        value: true,
      },
    },
    optionsLoadingState: {
      type: 'toggle',
      displayName: 'Options loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Options',
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
      validation: { schema: { type: 'string' }, defaultValue: 'var(--text-primary)' },
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
      validation: { schema: { type: 'string' }, defaultValue: 'var(--surfaces-surface-01)' },
      accordian: 'field',
    },
    fieldBorderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--borders-default)' },
      accordian: 'field',
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--primary-brand)' },
      accordian: 'field',
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--text-primary)' },
      accordian: 'field',
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--status-error-strong)' },
      accordian: 'field',
    },
    tagBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Tag Background',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--surfaces-surface-03)' },
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
      caseEnforcement: { value: 'none' },
      optionsLoadingState: { value: '{{false}}' },
      placeholder: { value: 'Add or select a tag' },
      dynamicHeight: { value: '{{true}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      schema: {
        value:
          "{{[\t{label: 'Newport',value: 'newport',visible: true,default: false},{label: 'New York',value: 'new_york',visible: true,default: false},{label: 'San Clemente',value: 'san_clemente',visible: true,default: false}\t]}}",
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
      labelColor: { value: 'var(--text-primary)' },
      labelWidth: { value: '33' },
      auto: { value: '{{true}}' },
      fieldBorderRadius: { value: '6' },
      selectedTextColor: { value: 'var(--text-primary)' },
      fieldBorderColor: { value: 'var(--borders-default)' },
      errTextColor: { value: 'var(--status-error-strong)' },
      fieldBackgroundColor: { value: 'var(--surfaces-surface-01)' },
      tagBackgroundColor: { value: 'var(--surfaces-surface-03)' },
      direction: { value: 'left' },
      alignment: { value: 'side' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      accentColor: { value: 'var(--primary-brand)' },
      widthType: { value: 'ofComponent' },
    },
  },
};
