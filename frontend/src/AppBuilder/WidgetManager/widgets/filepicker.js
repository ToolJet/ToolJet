export const filepickerConfig = {
  name: 'FilePicker',
  displayName: 'File Picker',
  description: 'File Picker',
  component: 'FilePicker',
  defaultSize: {
    width: 15,
    height: 100,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  actions: [
    {
      handle: 'clearFiles',
      displayName: 'Clear Files',
    },
    {
      handle: 'setFileName',
      displayName: 'Set File Name',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set Visibility',
    },
    {
      handle: 'setLoading',
      displayName: 'Set Loading',
    },
    {
      handle: 'setDisable',
      displayName: 'Set Disable',
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
    instructionText: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Drag and drop files or click here to upload',
      },
      accordian: 'Data',
    },
    enableDropzone: {
      type: 'toggle',
      displayName: 'Use drop zone',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Data',
    },
    enablePicker: {
      type: 'toggle',
      displayName: 'Use file picker',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      accordian: 'Data',
    },
    enableMultiple: {
      type: 'toggle',
      displayName: 'Allow picking multiple files',
      validation: {
        schema: { type: 'boolean' },
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
    },
    parseFileType: {
      type: 'select',
      displayName: 'File type',
      options: [
        { name: 'Autodetect from extension', value: 'auto-detect' },
        { name: 'CSV', value: 'csv' },
        { name: 'Microsoft Excel - xls', value: 'vnd.ms-excel' },
        {
          name: 'Microsoft Excel - xlsx',
          value: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'auto-detect',
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
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
  events: {
    onFileSelected: { displayName: 'On File Selected' },
    onFileLoaded: { displayName: 'On File Loaded' },
    onFileDeselected: { displayName: 'On File Deselected' },
  },
  validation: {
    enableValidation: {
      type: 'toggle',
      displayName: 'Make this field mandatory',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    fileType: {
      type: 'code',
      displayName: 'Accept file types',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'image/*',
      },
    },
    minSize: {
      type: 'code',
      displayName: 'Min size limit (Bytes)',
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
      displayName: 'Max size limit (Bytes)',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 1048576,
      },
    },
    minFileCount: {
      type: 'code',
      displayName: 'Min file count',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 2,
      },
    },
    maxFileCount: {
      type: 'code',
      displayName: 'Max file count',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 2,
      },
    },
  },
  styles: {
    dropzoneTitleColor: {
      type: 'colorSwatches',
      displayName: 'Title',
      validation: { schema: { type: 'string' }, defaultValue: false },
      accordian: 'File Drop Area',
    },
    dropzoneActiveColor: {
      type: 'colorSwatches',
      displayName: 'Active color',
      validation: { schema: { type: 'string' }, defaultValue: false },
      accordian: 'File Drop Area',
    },
    dropzoneErrorColor: {
      type: 'colorSwatches',
      displayName: 'Error color',
      validation: { schema: { type: 'string' }, defaultValue: false },
      accordian: 'File Drop Area',
    },
    containerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: false },
      accordian: 'Container',
    },
    containerBorder: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'transparent' },
      accordian: 'Container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border Radius',
      validation: { schema: { type: 'number' }, defaultValue: 6 },
      accordian: 'Container',
    },
    containerBoxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'string' }, defaultValue: '0px 1px 3px rgba(0,0,0,0.1)' },
      accordian: 'Container',
    },
    containerPadding: {
      type: 'numberInput',
      displayName: 'Padding',
      validation: { schema: { type: 'string' }, defaultValue: 16 },
      accordian: 'Container',
    },
  },
  exposedVariables: {
    file: [{ name: '', content: '', dataURL: '', type: '', parsedValue: null }],
    isParsing: false,
    isValid: true,
    fileSize: 0,
    isMandatory: false,
    isLoading: false,
    isVisible: true,
    isDisabled: false,
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Upload files' },
      instructionText: { value: 'Drag and drop files here or click to select files' },
      enableDropzone: { value: '{{true}}' },
      enablePicker: { value: '{{true}}' },
      enableMultiple: { value: '{{false}}' },
      parseContent: { value: '{{false}}' },
      parseFileType: { value: 'auto-detect' },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      borderRadius: { value: '{{6}}' },
      dropzoneTitleColor: { value: 'var(--cc-primary-text)' },
      dropzoneActiveColor: { value: 'var(--cc-primary-brand)' },
      dropzoneErrorColor: { value: 'var(--cc-status-systemStatus)' },
      containerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
      containerBorder: { value: 'none' },
      containerBoxShadow: { value: '0px 1px 3px rgba(0,0,0,0.1)' },
      containerPadding: { value: '16px' },
    },
    validation: {
      enableValidation: { value: '{{false}}' },
      fileType: { value: '{{}}' },
      minSize: { value: '{{50}}' },
      maxSize: { value: '{{51200000}}' },
      minFileCount: { value: '{{0}}' },
      maxFileCount: { value: '{{2}}' },
    },
  },
};
