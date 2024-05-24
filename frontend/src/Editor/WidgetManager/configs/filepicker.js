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
  ],
  properties: {
    instructionText: {
      type: 'code',
      displayName: 'Instruction text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Instruction text',
      },
    },
    enableDropzone: {
      type: 'code',
      displayName: 'Use drop zone',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    enablePicker: {
      type: 'code',
      displayName: 'Use file picker',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    enableMultiple: {
      type: 'code',
      displayName: 'Pick multiple files',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
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
    parseContent: {
      type: 'toggle',
      displayName: 'Parse content',
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
  },
  events: {
    onFileSelected: { displayName: 'On File Selected' },
    onFileLoaded: { displayName: 'On File Loaded' },
    onFileDeselected: { displayName: 'On File Deselected' },
  },
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
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
    },
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 4,
      },
    },
  },
  exposedVariables: {
    file: [{ name: '', content: '', dataURL: '', type: '', parsedData: '' }],
    isParsing: false,
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      instructionText: { value: 'Drag and drop files here or click to select files' },
      enableDropzone: { value: '{{true}}' },
      enablePicker: { value: '{{true}}' },
      maxFileCount: { value: '{{2}}' },
      enableMultiple: { value: '{{false}}' },
      fileType: { value: '{{"image/*"}}' },
      maxSize: { value: '{{1048576}}' },
      minSize: { value: '{{50}}' },
      parseContent: { value: '{{false}}' },
      parseFileType: { value: 'auto-detect' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      borderRadius: { value: '{{4}}' },
    },
  },
};
