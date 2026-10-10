// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antUploadConfig = {
  name: 'AntUpload',
  displayName: 'Upload',
  description:
    'Ant Design file picker (button or drag area); exposes the picked files with base64 content for a query to send',
  component: 'AntUpload',
  defaultSize: {
    width: 14,
    height: 40,
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
    variant: {
      type: 'switch',
      displayName: 'Style',
      options: [
        {
          displayName: 'Button',
          value: 'button',
        },
        {
          displayName: 'Dragger',
          value: 'dragger',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'button',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    buttonLabel: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Click to upload',
      },
    },
    hint: {
      type: 'code',
      displayName: 'Hint (drag area)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    accept: {
      type: 'code',
      displayName: 'Accepted types',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
      placeholder: '.pdf,image/*',
    },
    multiple: {
      type: 'toggle',
      displayName: 'Multiple files',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    maxCount: {
      type: 'code',
      displayName: 'Max files (0 = no limit)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 0,
      },
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
  },
  events: {
    onChange: {
      displayName: 'On files changed',
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    files: [],
  },
  actions: [
    {
      handle: 'clear',
      displayName: 'Clear',
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
      variant: {
        value: 'button',
      },
      buttonLabel: {
        value: 'Click to upload',
      },
      hint: {
        value: '',
      },
      accept: {
        value: '',
      },
      multiple: {
        value: '{{false}}',
      },
      maxCount: {
        value: '{{0}}',
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
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
