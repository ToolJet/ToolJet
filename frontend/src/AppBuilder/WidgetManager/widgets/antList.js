// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antListConfig = {
  name: 'AntList',
  displayName: 'List',
  description: 'Ant Design list of records with avatar, title, description and an action',
  component: 'AntList',
  defaultSize: {
    width: 20,
    height: 300,
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
    data: {
      type: 'code',
      displayName: 'Data',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
    },
    titleKey: {
      type: 'code',
      displayName: 'Title field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'title',
      },
    },
    descriptionKey: {
      type: 'code',
      displayName: 'Description field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'description',
      },
    },
    avatarKey: {
      type: 'code',
      displayName: 'Avatar field (name or image URL)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    extraKey: {
      type: 'code',
      displayName: 'Right-side field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    actionLabel: {
      type: 'code',
      displayName: 'Action label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
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
    pageSize: {
      type: 'code',
      displayName: 'Items per page (0 = all)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 0,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty message',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'No data',
      },
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
  events: {
    onItemClicked: {
      displayName: 'On item clicked',
    },
    onActionClicked: {
      displayName: 'On action clicked',
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
    selectedItem: {},
    selectedItemIndex: null,
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
      emptyText: {
        value: 'No data',
      },
      data: {
        value: "{{[{ id: 1, title: 'First item', description: 'Details' }]}}",
      },
      titleKey: {
        value: 'title',
      },
      descriptionKey: {
        value: 'description',
      },
      avatarKey: {
        value: '',
      },
      extraKey: {
        value: '',
      },
      actionLabel: {
        value: '',
      },
      bordered: {
        value: '{{false}}',
      },
      pageSize: {
        value: '{{0}}',
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
