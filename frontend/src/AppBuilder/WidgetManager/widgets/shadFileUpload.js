// GENERATED from WidgetManager/shadcnSource.pickers.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadFileUploadConfig = {
  name: 'ShadFileUpload',
  displayName: 'File upload',
  description:
    "shadcn/ui file upload: a dashed dropzone (drag and drop or click to browse) with a file list. accept is a MIME or extension list like 'image/*,.pdf'; maxSize and minSize in bytes. Exposes files [{ name, type, size, content (text), base64Data, dataURL, parsedData }] like the native File picker. Height: about 160px for the dropzone, 180px with a label; the list adds about 66px per file (dynamic height)",
  component: 'ShadFileUpload',
  defaultSize: {
    width: 12,
    height: 180,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    description: {
      type: 'code',
      displayName: 'Help text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    title: {
      type: 'code',
      displayName: 'Title',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Drag & drop files here',
      },
    },
    hint: {
      type: 'code',
      displayName: 'Hint (empty: accepted types and size)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    accept: {
      type: 'code',
      displayName: 'Accept file types',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
      placeholder: 'image/*,application/pdf,.csv',
    },
    multiple: {
      type: 'toggle',
      displayName: 'Allow multiple files',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    maxFiles: {
      type: 'code',
      displayName: 'Max files',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: 5,
      },
    },
    maxSize: {
      type: 'code',
      displayName: 'Max size (bytes, 0 for no limit)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: 5242880,
      },
    },
    minSize: {
      type: 'code',
      displayName: 'Min size (bytes)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: 0,
      },
    },
    showPreview: {
      type: 'toggle',
      displayName: 'Show image thumbnails',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    parseContent: {
      type: 'toggle',
      displayName: 'Parse content (CSV, TSV, Excel, JSON)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    parseFileType: {
      type: 'select',
      displayName: 'Parse as',
      options: [
        {
          name: 'Autodetect from type',
          value: 'auto-detect',
        },
        {
          name: 'CSV',
          value: 'csv',
        },
        {
          name: 'TSV',
          value: 'tsv',
        },
        {
          name: 'Excel (xls)',
          value: 'vnd.ms-excel',
        },
        {
          name: 'Excel (xlsx)',
          value: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    },
    delimiter: {
      type: 'code',
      displayName: 'CSV delimiter',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: ',',
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
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
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  validation: {
    mandatory: {
      type: 'toggle',
      displayName: 'Make this field mandatory',
    },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: "{{components.text1.text === 'yes' || 'Enter yes'}}",
    },
  },
  events: {
    onFileSelected: {
      displayName: 'On file selected',
    },
    onFileDeselected: {
      displayName: 'On file deselected',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    helpTextColor: {
      type: 'colorSwatches',
      displayName: 'Help text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    dropzoneBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Dropzone background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    dropzoneBorderColor: {
      type: 'colorSwatches',
      displayName: 'Dropzone border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Upload icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    iconBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Upload icon background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Title color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hintColor: {
      type: 'colorSwatches',
      displayName: 'Hint color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (drag over, browse link)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    fileItemBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'File row background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    fileItemBorderColor: {
      type: 'colorSwatches',
      displayName: 'File row border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    errorColor: {
      type: 'colorSwatches',
      displayName: 'Error color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    isValid: true,
    isMandatory: false,
    files: [],
    fileSize: 0,
    isParsing: false,
  },
  actions: [
    {
      handle: 'clearFiles',
      displayName: 'Clear files',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      label: {
        value: 'Attachments',
      },
      description: {
        value: '',
      },
      title: {
        value: 'Drag & drop files here',
      },
      hint: {
        value: '',
      },
      accept: {
        value: 'image/*,application/pdf',
      },
      multiple: {
        value: '{{true}}',
      },
      maxFiles: {
        value: '{{5}}',
      },
      maxSize: {
        value: '{{5242880}}',
      },
      minSize: {
        value: '{{0}}',
      },
      showPreview: {
        value: '{{true}}',
      },
      parseContent: {
        value: '{{false}}',
      },
      parseFileType: {
        value: 'auto-detect',
      },
      delimiter: {
        value: ',',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    validation: {
      mandatory: {
        value: '{{false}}',
      },
      customRule: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
