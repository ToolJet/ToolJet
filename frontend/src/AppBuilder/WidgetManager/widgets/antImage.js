// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antImageConfig = {
  name: 'AntImage',
  displayName: 'Image',
  description: 'Ant Design image with click-to-preview',
  component: 'AntImage',
  defaultSize: {
    width: 12,
    height: 200,
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
    src: {
      type: 'code',
      displayName: 'Image URL',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    alt: {
      type: 'code',
      displayName: 'Alt text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    fit: {
      type: 'switch',
      displayName: 'Fit',
      options: [
        {
          displayName: 'Cover',
          value: 'cover',
        },
        {
          displayName: 'Contain',
          value: 'contain',
        },
        {
          displayName: 'Fill',
          value: 'fill',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'cover',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    preview: {
      type: 'toggle',
      displayName: 'Click to preview',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    radius: {
      type: 'code',
      displayName: 'Corner radius (px)',
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
    onClick: {
      displayName: 'On click',
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
  },
  actions: [],
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
      src: {
        value: 'https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg',
      },
      alt: {
        value: '',
      },
      fit: {
        value: 'cover',
      },
      preview: {
        value: '{{true}}',
      },
      radius: {
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
