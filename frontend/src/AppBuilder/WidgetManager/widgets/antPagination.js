// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antPaginationConfig = {
  name: 'AntPagination',
  displayName: 'Pagination',
  description: 'Ant Design pagination (drive a server-side query with currentPage and pageSize)',
  component: 'AntPagination',
  defaultSize: {
    width: 16,
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
    total: {
      type: 'code',
      displayName: 'Total items',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 50,
      },
    },
    pageSize: {
      type: 'code',
      displayName: 'Page size',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 10,
      },
    },
    defaultCurrent: {
      type: 'code',
      displayName: 'Initial page',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1,
      },
    },
    simple: {
      type: 'toggle',
      displayName: 'Simple',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showSizeChanger: {
      type: 'toggle',
      displayName: 'Page size picker',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showTotal: {
      type: 'toggle',
      displayName: 'Show total',
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
    onPageChanged: {
      displayName: 'On page changed',
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
    currentPage: 1,
    pageSize: 10,
  },
  actions: [
    {
      handle: 'setPage',
      displayName: 'Set page',
      params: [
        {
          handle: 'page',
          displayName: 'Page',
          defaultValue: '{{1}}',
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
      total: {
        value: '{{50}}',
      },
      pageSize: {
        value: '{{10}}',
      },
      defaultCurrent: {
        value: '{{1}}',
      },
      simple: {
        value: '{{false}}',
      },
      showSizeChanger: {
        value: '{{false}}',
      },
      showTotal: {
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
