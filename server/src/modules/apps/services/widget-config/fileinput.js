export const fileinputConfig = {
  name: 'FileInput',
  displayName: 'File input',
  description: 'File input',
  component: 'FileInput',
  defaultSize: {
    width: 10,
    height: 60,
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
    instructionText: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Click to select file',
      },
      accordian: 'Data',
    },
    enableMultiple: {
      type: 'toggle',
      displayName: 'Allow uploading multiple files',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      accordian: 'Data',
    },
    enableClearSelection: {
      type: 'toggle',
      displayName: 'Enable clear selection',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      accordian: 'Data',
    },
    parseContent: {
      type: 'toggle',
      displayName: 'Enable parsing',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      accordian: 'Data',
    },
    parseFileType: {
      type: 'select',
      displayName: 'File type',
      options: [
        { name: 'Autodetect from extension', value: 'auto-detect' },
        { name: 'CSV', value: 'csv' },
        { name: 'Microsoft Excel - xls', value: 'xls' },
        {
          name: 'Microsoft Excel - xlsx',
          value: 'xlsx',
        },
        {
          name: 'JSON',
          value: 'json',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'auto-detect',
      },
      conditionallyRender: [
        {
          key: 'parseContent',
          value: true,
        },
      ],
      accordian: 'Data',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      section: 'additionalActions',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
    },
  },
  validation: {
    enableValidation: {
      type: 'toggle',
      displayName: 'Mark as mandatory',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    fileType: {
      type: 'code',
      displayName: 'File Type',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '*/*',
      },
    },
    minSize: {
      type: 'code',
      displayName: 'Min size (Bytes)',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 50,
      },
    },
    maxSize: {
      type: 'code',
      displayName: 'Max size (Bytes)',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 51200000,
      },
    },
    minFileCount: {
      type: 'code',
      displayName: 'Min files',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 0,
      },
      conditionallyRender: [
        {
          key: 'enableMultiple',
          value: true,
          parentObjectKey: 'properties',
        },
      ],
    },
    maxFileCount: {
      type: 'code',
      displayName: 'Max files',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 2,
      },
      conditionallyRender: [
        {
          key: 'enableMultiple',
          value: true,
          parentObjectKey: 'properties',
        },
      ],
    },
  },
  events: {
    onFileSelected: { displayName: 'On File Selected' },
    onFileLoaded: { displayName: 'On File Loaded' },
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
    icon: {
      type: 'icon',
      displayName: 'Icon',
      validation: { schema: { type: 'string' }, defaultValue: 'IconFileSearch' },
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
      accordian: 'field',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-default-border)',
      },
      accordian: 'field',
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
      accordian: 'field',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-text)',
      },
      accordian: 'field',
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-error-systemStatus)',
      },
      accordian: 'field',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 6,
      },
      accordian: 'field',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'field',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
  },
  exposedVariables: {
    files: [],
    id: '',
    isParsing: false,
    isValid: true,
    fileSize: 0,
    isMandatory: false,
    isLoading: false,
    isVisible: true,
    isDisabled: false,
  },
  actions: [
    {
      handle: 'clear',
      displayName: 'Clear',
    },
    {
      handle: 'setFocus',
      displayName: 'Set focus',
    },
    {
      handle: 'setBlur',
      displayName: 'Set blur',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'disable',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'disable',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'loading',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Label' },
      instructionText: { value: 'Click to select file' },
      enableMultiple: { value: '{{true}}', fxActive: false },
      parseContent: { value: '{{false}}' },
      enableClearSelection: { value: '{{false}}' },
      parseFileType: { value: 'auto-detect' },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      labelColor: { value: 'var(--cc-primary-text)' },
      labelWidth: { value: '33' },
      auto: { value: '{{true}}' },
      direction: { value: 'left' },
      alignment: { value: 'top' },
      widthType: { value: 'ofComponent' },
      icon: { value: 'IconFileSearch' },
      iconColor: { value: 'var(--cc-default-icon)' },
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-default-border)' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      textColor: { value: 'var(--cc-primary-text)' },
      errTextColor: { value: 'var(--cc-error-systemStatus)' },
      borderRadius: { value: '{{6}}' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
    validation: {
      enableValidation: { value: '{{false}}' },
      fileType: { value: '*/*' },
      minSize: { value: '{{50}}' },
      maxSize: { value: '{{51200000}}' },
      minFileCount: { value: '{{0}}' },
      maxFileCount: { value: '{{2}}' },
    },
  },
};
