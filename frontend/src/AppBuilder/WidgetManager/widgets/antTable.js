// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antTableConfig = {
  name: 'AntTable',
  displayName: 'Table',
  description: 'Ant Design table',
  component: 'AntTable',
  defaultSize: {
    width: 28,
    height: 420,
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
    columns: {
      type: 'code',
      displayName: 'Columns',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ title: 'Name', dataIndex: 'name', kind: 'text|tag|money|date' }]",
    },
    pageSize: {
      type: 'code',
      displayName: 'Rows per page',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 8,
      },
    },
    size: {
      type: 'switch',
      displayName: 'Density',
      options: [
        {
          displayName: 'Small',
          value: 'small',
        },
        {
          displayName: 'Middle',
          value: 'middle',
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
        defaultValue: 'middle',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
    onRowClicked: {
      displayName: 'On row clicked',
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
    selectedRow: {},
    selectedRowIndex: null,
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
        value: "{{[{ id: 1, name: 'Sample', status: 'active', amount: 1200 }]}}",
      },
      columns: {
        value:
          "{{[{ title: 'Name', dataIndex: 'name' }, { title: 'Status', dataIndex: 'status', kind: 'tag' }, { title: 'Amount', dataIndex: 'amount', kind: 'money' }]}}",
      },
      pageSize: {
        value: '{{8}}',
      },
      size: {
        value: 'middle',
      },
      bordered: {
        value: '{{false}}',
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
