// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antDescriptionsConfig = {
  name: 'AntDescriptions',
  displayName: 'Descriptions',
  description: 'Ant Design label and value pairs',
  component: 'AntDescriptions',
  defaultSize: {
    width: 20,
    height: 160,
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
    title: {
      type: 'code',
      displayName: 'Title',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    items: {
      type: 'code',
      displayName: 'Items',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ label: 'Status', value: 'Active' }]",
    },
    column: {
      type: 'code',
      displayName: 'Columns',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 2,
      },
    },
    bordered: {
      type: 'toggle',
      displayName: 'Bordered',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    layout: {
      type: 'switch',
      displayName: 'Layout',
      options: [
        {
          displayName: 'Horizontal',
          value: 'horizontal',
        },
        {
          displayName: 'Vertical',
          value: 'vertical',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'horizontal',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
      title: {
        value: '',
      },
      items: {
        value: "{{[{ label: 'Owner', value: 'Ada Lovelace' }, { label: 'Status', value: 'Active' }]}}",
      },
      column: {
        value: '{{2}}',
      },
      bordered: {
        value: '{{false}}',
      },
      layout: {
        value: 'horizontal',
      },
      dynamicHeight: {
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
