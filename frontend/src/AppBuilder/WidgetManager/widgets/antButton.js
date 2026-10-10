// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antButtonConfig = {
  name: 'AntButton',
  displayName: 'Button',
  description: 'Ant Design button',
  component: 'AntButton',
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
    text: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Button',
      },
    },
    type: {
      type: 'switch',
      displayName: 'Type',
      options: [
        {
          displayName: 'Primary',
          value: 'primary',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Dashed',
          value: 'dashed',
        },
        {
          displayName: 'Text',
          value: 'text',
        },
        {
          displayName: 'Link',
          value: 'link',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'primary',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    danger: {
      type: 'toggle',
      displayName: 'Danger',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    block: {
      type: 'toggle',
      displayName: 'Full width',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
      text: {
        value: 'Button',
      },
      type: {
        value: 'primary',
      },
      danger: {
        value: '{{false}}',
      },
      block: {
        value: '{{false}}',
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
