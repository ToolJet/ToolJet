// GENERATED from WidgetManager/shadcnSource.table.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadTableConfig = {
  name: 'ShadTable',
  displayName: 'Table',
  description:
    'Superseded for new builds: use Table with styles.tableLook "shadcn" (ToolJet\'s own Table drawn in the shadcn/ui look, with every Table feature and convention). Kept so existing apps keep working. shadcn/ui data table: typed columns (text, number, currency, date, badge, tags, boolean, link, image, avatar, progress, buttons), search, sort, filters, pagination (client or server side), single or bulk selection, inline editing with save/discard, CSV export, column chooser. Native Table conventions',
  component: 'ShadTable',
  defaultSize: {
    width: 30,
    height: 440,
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
      displayName: 'Table data',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
    },
    columns: {
      type: 'code',
      displayName: 'Columns (empty: from the data)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder:
        "[{ key: 'name', name: 'Name' }, { key: 'status', name: 'Status', columnType: 'badge' }, { key: 'amount', name: 'Amount', columnType: 'currency' }]",
    },
    idField: {
      type: 'code',
      displayName: 'Row id field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'id',
      },
    },
    enablePagination: {
      type: 'toggle',
      displayName: 'Pagination',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    rowsPerPage: {
      type: 'code',
      displayName: 'Rows per page',
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
      displayName: 'Total records (server-side)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 0,
      },
    },
    enablePrevButton: {
      type: 'toggle',
      displayName: 'Previous page enabled (server-side)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    enableNextButton: {
      type: 'toggle',
      displayName: 'Next page enabled (server-side)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    displaySearchBox: {
      type: 'toggle',
      displayName: 'Search box',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    searchPlaceholder: {
      type: 'code',
      displayName: 'Search placeholder',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Search…',
      },
    },
    serverSideSearch: {
      type: 'toggle',
      displayName: 'Server-side search',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    enabledSort: {
      type: 'toggle',
      displayName: 'Column sorting',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    serverSideSort: {
      type: 'toggle',
      displayName: 'Server-side sort',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showFilterButton: {
      type: 'toggle',
      displayName: 'Filter button',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    serverSideFilter: {
      type: 'toggle',
      displayName: 'Server-side filters',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    allowSelection: {
      type: 'toggle',
      displayName: 'Row selection',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showBulkSelector: {
      type: 'toggle',
      displayName: 'Bulk selection (checkboxes)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    highlightSelectedRow: {
      type: 'toggle',
      displayName: 'Highlight selected row',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    disableRowDeselection: {
      type: 'toggle',
      displayName: 'Keep a row selected (no deselect)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    defaultSelectedRow: {
      type: 'code',
      displayName: 'Default selected row ({ key: value })',
      validation: {
        schema: {
          type: 'object',
        },
        defaultValue: {},
      },
    },
    hideColumnSelectorButton: {
      type: 'toggle',
      displayName: 'Hide column chooser',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showDownloadButton: {
      type: 'toggle',
      displayName: 'Download button',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showRefreshButton: {
      type: 'toggle',
      displayName: 'Refresh button',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showBulkUpdateActions: {
      type: 'toggle',
      displayName: 'Save / discard bar for edits',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showRowCount: {
      type: 'toggle',
      displayName: 'Row count in the footer',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    cellSize: {
      type: 'switch',
      displayName: 'Row height',
      options: [
        {
          displayName: 'Condensed',
          value: 'condensed',
        },
        {
          displayName: 'Regular',
          value: 'regular',
        },
        {
          displayName: 'Spacious',
          value: 'spacious',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'regular',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    tableType: {
      type: 'switch',
      displayName: 'Rows',
      options: [
        {
          displayName: 'Regular',
          value: 'regular',
        },
        {
          displayName: 'Striped',
          value: 'striped',
        },
        {
          displayName: 'Bordered',
          value: 'bordered',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'regular',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    stickyHeader: {
      type: 'toggle',
      displayName: 'Sticky header (scrolls inside)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    currency: {
      type: 'code',
      displayName: 'Currency (currency columns)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'USD',
      },
    },
    locale: {
      type: 'code',
      displayName: 'Number locale',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'en-US',
      },
    },
    dateFormat: {
      type: 'code',
      displayName: 'Date format (date columns)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'DD MMM YYYY',
      },
    },
    badgeColors: {
      type: 'code',
      displayName: 'Badge colours by value',
      validation: {
        schema: {
          type: 'object',
        },
        defaultValue: {},
      },
      placeholder: "{ Paid: '#16a34a', Overdue: '#dc2626' }",
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty message',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'No results.',
      },
    },
    emptyDescription: {
      type: 'code',
      displayName: 'Empty description',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
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
    onSelectionChanged: {
      displayName: 'Selection changed',
    },
    onActionButtonClicked: {
      displayName: 'Action button clicked',
    },
    onSearch: {
      displayName: 'Search',
    },
    onSort: {
      displayName: 'Sort applied',
    },
    onFilterChanged: {
      displayName: 'Filter changed',
    },
    onPageChanged: {
      displayName: 'Page changed',
    },
    onCellValueChanged: {
      displayName: 'Cell value changed',
    },
    onBulkUpdate: {
      displayName: 'Save changes',
    },
    onCancelChanges: {
      displayName: 'Cancel changes',
    },
    onRefresh: {
      displayName: 'Refresh',
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
      displayName: 'Accent (checkboxes, focus, active page)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Table background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    headerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Header row background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    headerTextColor: {
      type: 'colorSwatches',
      displayName: 'Header text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Cell text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    mutedTextColor: {
      type: 'colorSwatches',
      displayName: 'Secondary text color (footer, empty state)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border and row divider color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    rowHoverColor: {
      type: 'colorSwatches',
      displayName: 'Row hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    selectedRowColor: {
      type: 'colorSwatches',
      displayName: 'Selected row background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    stripedRowColor: {
      type: 'colorSwatches',
      displayName: 'Striped row background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Table radius',
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
    fontSize: {
      type: 'numberInput',
      displayName: 'Font size (px)',
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
    headerCasing: {
      type: 'select',
      displayName: 'Header casing',
      options: [
        {
          name: 'As typed',
          value: 'none',
        },
        {
          name: 'UPPERCASE',
          value: 'uppercase',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'none',
      },
    },
    showBorder: {
      type: 'toggle',
      displayName: 'Border around the table',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    selectedRow: {},
    selectedRowId: null,
    selectedRows: [],
    selectedRowsId: [],
    pageIndex: 1,
    searchText: '',
    sortApplied: [],
    filters: [],
    changeSet: {},
    dataUpdates: [],
    updatedData: [],
    currentData: [],
    currentPageData: [],
    filteredData: [],
    lastActionClicked: {},
  },
  actions: [
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
      handle: 'selectRow',
      displayName: 'Select row',
      params: [
        {
          handle: 'key',
          displayName: 'Key',
          defaultValue: 'id',
        },
        {
          handle: 'value',
          displayName: 'Value',
        },
      ],
    },
    {
      handle: 'deselectRow',
      displayName: 'Deselect row',
      params: [],
    },
    {
      handle: 'selectRows',
      displayName: 'Select rows',
      params: [
        {
          handle: 'key',
          displayName: 'Key',
          defaultValue: 'id',
        },
        {
          handle: 'values',
          displayName: 'Values',
          defaultValue: '{{[]}}',
        },
      ],
    },
    {
      handle: 'deselectRows',
      displayName: 'Deselect rows',
      params: [
        {
          handle: 'key',
          displayName: 'Key',
          defaultValue: 'id',
        },
        {
          handle: 'values',
          displayName: 'Values',
          defaultValue: '{{[]}}',
        },
      ],
    },
    {
      handle: 'selectAllRows',
      displayName: 'Select all rows',
      params: [],
    },
    {
      handle: 'deselectAllRows',
      displayName: 'Deselect all rows',
      params: [],
    },
    {
      handle: 'setFilters',
      displayName: 'Set filters',
      params: [
        {
          handle: 'parameters',
          displayName: 'Filters',
          defaultValue: "{{[{ column: 'status', condition: 'equals', value: 'Paid' }]}}",
        },
      ],
    },
    {
      handle: 'clearFilters',
      displayName: 'Clear filters',
      params: [],
    },
    {
      handle: 'setSort',
      displayName: 'Set sort',
      params: [
        {
          handle: 'columnKey',
          displayName: 'Column key',
        },
        {
          handle: 'direction',
          displayName: 'Direction (asc, desc)',
          defaultValue: 'asc',
        },
      ],
    },
    {
      handle: 'setSearchText',
      displayName: 'Set search text',
      params: [
        {
          handle: 'text',
          displayName: 'Text',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'discardChanges',
      displayName: 'Discard changes',
      params: [],
    },
    {
      handle: 'downloadTableData',
      displayName: 'Download table data',
      params: [
        {
          handle: 'type',
          displayName: 'Type (csv or json)',
          defaultValue: 'csv',
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
          "{{[{ id: 1, name: 'Ada Lovelace', status: 'Paid', amount: 1250, date: '2026-09-14' }, { id: 2, name: 'Alan Turing', status: 'Pending', amount: 980.5, date: '2026-09-21' }, { id: 3, name: 'Grace Hopper', status: 'Overdue', amount: 3120, date: '2026-08-30' }]}}",
      },
      columns: {
        value:
          "{{[{ key: 'name', name: 'Name' }, { key: 'status', name: 'Status', columnType: 'badge' }, { key: 'date', name: 'Date', columnType: 'date' }, { key: 'amount', name: 'Amount', columnType: 'currency' }]}}",
      },
      idField: {
        value: 'id',
      },
      enablePagination: {
        value: '{{true}}',
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
      enablePrevButton: {
        value: '{{true}}',
      },
      enableNextButton: {
        value: '{{true}}',
      },
      displaySearchBox: {
        value: '{{true}}',
      },
      searchPlaceholder: {
        value: 'Search…',
      },
      serverSideSearch: {
        value: '{{false}}',
      },
      enabledSort: {
        value: '{{true}}',
      },
      serverSideSort: {
        value: '{{false}}',
      },
      showFilterButton: {
        value: '{{true}}',
      },
      serverSideFilter: {
        value: '{{false}}',
      },
      allowSelection: {
        value: '{{true}}',
      },
      showBulkSelector: {
        value: '{{false}}',
      },
      highlightSelectedRow: {
        value: '{{true}}',
      },
      disableRowDeselection: {
        value: '{{false}}',
      },
      defaultSelectedRow: {
        value: '{{{}}}',
      },
      hideColumnSelectorButton: {
        value: '{{false}}',
      },
      showDownloadButton: {
        value: '{{false}}',
      },
      showRefreshButton: {
        value: '{{false}}',
      },
      showBulkUpdateActions: {
        value: '{{true}}',
      },
      showRowCount: {
        value: '{{true}}',
      },
      cellSize: {
        value: 'regular',
      },
      tableType: {
        value: 'regular',
      },
      stickyHeader: {
        value: '{{true}}',
      },
      currency: {
        value: 'USD',
      },
      locale: {
        value: 'en-US',
      },
      dateFormat: {
        value: 'DD MMM YYYY',
      },
      badgeColors: {
        value: '{{{}}}',
      },
      emptyText: {
        value: 'No results.',
      },
      emptyDescription: {
        value: '',
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
      headerCasing: {
        value: 'none',
      },
      showBorder: {
        value: true,
      },
    },
  },
};
