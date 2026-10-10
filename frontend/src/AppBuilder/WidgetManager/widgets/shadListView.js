// GENERATED from WidgetManager/shadcnSource.layout.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadListViewConfig = {
  name: 'ShadListView',
  displayName: 'List view',
  description:
    'shadcn/ui list or grid: one canvas repeated per item of data; parent components to it and bind them to {{listItem.<field>}}. A click selects the item (selectedItem, onRowClicked); optional pagination (client or server side), dividers, hover and selected highlight. Items have a fixed height (rowHeight)',
  component: 'ShadListView',
  defaultSize: {
    width: 30,
    height: 400,
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
      displayName: 'List data',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 1, name: 'Ada' }]",
    },
    mode: {
      type: 'switch',
      displayName: 'Layout',
      options: [
        {
          displayName: 'List',
          value: 'list',
        },
        {
          displayName: 'Grid',
          value: 'grid',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'list',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    columns: {
      type: 'code',
      displayName: 'Grid columns',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 3,
      },
    },
    rowHeight: {
      type: 'code',
      displayName: 'Item height (px)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 72,
      },
    },
    gap: {
      type: 'code',
      displayName: 'Gap between items (px)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 8,
      },
    },
    idField: {
      type: 'code',
      displayName: 'Id field (for selection across data changes)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'id',
      },
    },
    showBorder: {
      type: 'toggle',
      displayName: 'Dividers between items (list)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    highlightSelectedRow: {
      type: 'toggle',
      displayName: 'Highlight selected item',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    enablePagination: {
      type: 'toggle',
      displayName: 'Pagination',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    rowsPerPage: {
      type: 'code',
      displayName: 'Items per page',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 10,
      },
    },
    serverSidePagination: {
      type: 'toggle',
      displayName: 'Server-side pagination (data is one page)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    totalRecords: {
      type: 'code',
      displayName: 'Total items (server-side)',
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
        defaultValue: 'No items',
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
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
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onRowClicked: {
      displayName: 'Row clicked',
    },
    onRecordClicked: {
      displayName: 'Record clicked',
    },
    onPageChanged: {
      displayName: 'Page changed',
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
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (selected outline, pagination)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'List background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Item background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemHoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Item hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    selectedItemBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Selected item background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemBorderColor: {
      type: 'colorSwatches',
      displayName: 'Item border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    dividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    itemBorderRadius: {
      type: 'numberInput',
      displayName: 'Item radius',
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
      },
    },
    itemShadow: {
      type: 'select',
      displayName: 'Item shadow',
      options: [
        {
          name: 'None',
          value: 'none',
        },
        {
          name: 'Small',
          value: 'sm',
        },
        {
          name: 'Medium',
          value: 'md',
        },
        {
          name: 'Large',
          value: 'lg',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'none',
      },
    },
    padding: {
      type: 'numberInput',
      displayName: 'Padding around the list (px)',
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
      },
    },
    emptyTextColor: {
      type: 'colorSwatches',
      displayName: 'Empty message color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    data: {},
    children: {},
    selectedItem: {},
    selectedItemId: null,
    selectedRecord: {},
    selectedRecordId: null,
    selectedRow: {},
    selectedRowId: null,
    pageIndex: 1,
  },
  actions: [
    {
      handle: 'selectItem',
      displayName: 'Select item',
      params: [
        {
          handle: 'id',
          displayName: 'Item id (idField value)',
        },
      ],
    },
    {
      handle: 'clearSelection',
      displayName: 'Clear selection',
      params: [],
    },
    {
      handle: 'setPage',
      displayName: 'Set page',
      params: [
        {
          handle: 'page',
          displayName: 'Page (1-based)',
          defaultValue: '{{1}}',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
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
      data: {
        value:
          "{{[{ id: 1, name: 'Ada Lovelace', role: 'Engineering' }, { id: 2, name: 'Alan Turing', role: 'Research' }, { id: 3, name: 'Grace Hopper', role: 'Platform' }]}}",
      },
      mode: {
        value: 'list',
      },
      columns: {
        value: '{{3}}',
      },
      rowHeight: {
        value: '{{72}}',
      },
      gap: {
        value: '{{8}}',
      },
      idField: {
        value: 'id',
      },
      showBorder: {
        value: '{{false}}',
      },
      highlightSelectedRow: {
        value: '{{true}}',
      },
      enablePagination: {
        value: '{{false}}',
      },
      rowsPerPage: {
        value: '{{10}}',
      },
      serverSidePagination: {
        value: '{{false}}',
      },
      totalRecords: {
        value: '{{0}}',
      },
      emptyText: {
        value: 'No items',
      },
      dynamicHeight: {
        value: '{{true}}',
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
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
      itemShadow: {
        value: 'none',
      },
    },
  },
};
