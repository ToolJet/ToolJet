// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antAvatarConfig = {
  name: 'AntAvatar',
  displayName: 'Avatar',
  description: 'Ant Design avatar or avatar group',
  component: 'AntAvatar',
  defaultSize: {
    width: 6,
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
    names: {
      type: 'code',
      displayName: 'Names (one or many)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'array',
            },
          ],
        },
        defaultValue: 'Ada Lovelace',
      },
    },
    src: {
      type: 'code',
      displayName: 'Image URL (single avatar)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Small',
          value: 'small',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Large',
          value: 'large',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    maxCount: {
      type: 'code',
      displayName: 'Max shown',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 4,
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
  events: {},
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
      names: {
        value: 'Ada Lovelace',
      },
      src: {
        value: '',
      },
      size: {
        value: 'default',
      },
      maxCount: {
        value: '{{4}}',
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
