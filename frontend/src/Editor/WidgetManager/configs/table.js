export const tableConfig = {
  name: 'Table',
  displayName: 'Table',
  description: 'Display paginated tabular data',
  component: 'Table',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      validation: {
        schema: { type: 'string' },
      },
    },
    data: {
      type: 'code',
      displayName: 'Table data',
      validation: {
        schema: {
          type: 'array',
          element: { type: 'object' },
        },
        defaultValue: "[{ id: 1, name: 'Sarah', email: 'sarah@mail.com' }]",
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    columns: {
      type: 'array',
      displayName: 'Table Columns',
    },
    useDynamicColumn: {
      type: 'toggle',
      displayName: 'Use dynamic column',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    columnData: {
      type: 'code',
      displayName: 'Column data',
    },
    rowsPerPage: {
      type: 'code',
      displayName: 'Number of rows per page',
      validation: {
        schema: { type: 'number' },
        defaultValue: 10,
      },
    },

    enableNextButton: {
      type: 'toggle',
      displayName: 'Enable next page button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    enabledSort: {
      type: 'toggle',
      displayName: 'Enable column sorting',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    hideColumnSelectorButton: {
      type: 'toggle',
      displayName: 'Hide column selector button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    enablePrevButton: {
      type: 'toggle',
      displayName: 'Enable previous page button',
      validation: {
        schema: { type: 'boolean' },
      },
    },
    totalRecords: {
      type: 'code',
      displayName: 'Total records server side',
      validation: {
        schema: { type: 'number' },
        defaultValue: 10,
      },
    },
    enablePagination: {
      type: 'toggle',
      displayName: 'Enable pagination',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    serverSidePagination: {
      type: 'clientServerSwitch',
      displayName: 'Type',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      options: [
        { displayName: 'Client side', value: 'clientSide' },
        { displayName: 'Server side', value: 'serverSide' },
      ],
    },
    serverSideSearch: {
      type: 'clientServerSwitch',
      displayName: 'Type',
      options: [
        { displayName: 'Client side', value: 'clientSide' },
        { displayName: 'Server side', value: 'serverSide' },
      ],
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    serverSideSort: {
      type: 'clientServerSwitch',
      displayName: 'Type',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      options: [
        { displayName: 'Client side', value: 'clientSide' },
        { displayName: 'Server side', value: 'serverSide' },
      ],
    },
    serverSideFilter: {
      type: 'clientServerSwitch',
      displayName: 'Type',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      options: [
        { displayName: 'Client side', value: 'clientSide' },
        { displayName: 'Server side', value: 'serverSide' },
      ],
      defaultValue: 'clientSide',
    },
    actionButtonBackgroundColor: {
      type: 'color',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
    actionButtonTextColor: {
      type: 'color',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
    displaySearchBox: {
      type: 'toggle',
      displayName: 'Show search',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    showDownloadButton: {
      type: 'toggle',
      displayName: 'Show download button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    showFilterButton: {
      type: 'toggle',
      displayName: 'Enable filtering',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    showBulkUpdateActions: {
      type: 'toggle',
      displayName: 'Show update buttons',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    allowSelection: {
      type: 'toggle',
      displayName: 'Allow selection',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    showBulkSelector: {
      type: 'toggle',
      displayName: 'Bulk selection',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    highlightSelectedRow: {
      type: 'toggle',
      displayName: 'Highlight selected row',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    defaultSelectedRow: {
      type: 'code',
      displayName: 'Default selected row',
      validation: {
        schema: {
          type: 'object',
        },
        defaultValue: { id: 1 },
      },
    },

    showAddNewRowButton: {
      type: 'toggle',
      displayName: 'Show add new row button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    selectRowOnCellEdit: {
      type: 'toggle',
      displayName: 'Select row on cell edit',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop ' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  defaultSize: {
    width: 29,
    height: 456,
  },
  events: {
    onRowHovered: { displayName: 'Row hovered' },
    onRowClicked: { displayName: 'Row clicked' },
    onBulkUpdate: { displayName: 'Save changes' },
    onPageChanged: { displayName: 'Page changed' },
    onSearch: { displayName: 'Search' },
    onCancelChanges: { displayName: 'Cancel changes' },
    onSort: { displayName: 'Sort applied' },
    onCellValueChanged: { displayName: 'Cell value changed' },
    onFilterChanged: { displayName: 'Filter changed' },
    onNewRowsAdded: { displayName: 'Add new rows' },
  },
  styles: {
    textColor: {
      type: 'color',
      displayName: 'Text Color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000',
      },
    },
    actionButtonRadius: {
      type: 'code',
      displayName: 'Action button radius',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'boolean' }] },
        defaultValue: '0',
      },
    },
    tableType: {
      type: 'select',
      displayName: 'Table type',
      options: [
        { name: 'Bordered', value: 'table-bordered' },
        { name: 'Regular', value: 'table-classic' },
        { name: 'Striped', value: 'table-striped' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'table-classic',
      },
    },
    cellSize: {
      type: 'select',
      displayName: 'Cell size',
      options: [
        { name: 'Condensed', value: 'condensed' },
        { name: 'Regular', value: 'regular' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'regular',
      },
    },
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 4,
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  exposedVariables: {
    selectedRow: {},
    changeSet: {},
    dataUpdates: [],
    pageIndex: 1,
    searchText: '',
    selectedRows: [],
    filters: [],
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
    {
      handle: 'selectRow',
      displayName: 'Select row',
      params: [
        { handle: 'key', displayName: 'Key' },
        { handle: 'value', displayName: 'Value' },
      ],
    },
    {
      handle: 'deselectRow',
      displayName: 'Deselect row',
    },
    {
      handle: 'discardChanges',
      displayName: 'Discard Changes',
    },
    {
      handle: 'discardNewlyAddedRows',
      displayName: 'Discard newly added rows',
    },
    {
      displayName: 'Download table data',
      handle: 'downloadTableData',
      params: [
        {
          handle: 'type',
          displayName: 'Type',
          options: [
            { name: 'Download as Excel', value: 'xlsx' },
            { name: 'Download as CSV', value: 'csv' },
            { name: 'Download as PDF', value: 'pdf' },
          ],
          defaultValue: `{{Download as Excel}}`,
          type: 'select',
        },
      ],
    },
    {
      handle: 'selectAllRows',
      displayName: 'Select all rows',
    },
    {
      handle: 'deselectAllRows',
      displayName: 'Deselect all rows',
    },
    {
      handle: 'setFilters',
      displayName: 'Set filters',
      params: [{ handle: 'parameters', displayName: 'Parameters' }],
    },
    {
      handle: 'clearFilters',
      displayName: 'Clear filters',
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      title: { value: 'Table' },
      visible: { value: '{{true}}' },
      loadingState: { value: '{{false}}' },
      data: {
        value:
          "{{ [ \n\t\t{ id: 1, name: 'Sarah', email: 'sarah@example.com'}, \n\t\t{ id: 2, name: 'Lisa', email: 'lisa@example.com'}, \n\t\t{ id: 3, name: 'Sam', email: 'sam@example.com'}, \n\t\t{ id: 4, name: 'Jon', email: 'jon@example.com'} \n] }}",
      },
      useDynamicColumn: { value: '{{false}}' },
      columnData: {
        value:
          "{{[{name: 'email', key: 'email', id: '1'}, {name: 'Full name', key: 'name', id: '2', isEditable: true}]}}",
      },
      rowsPerPage: { value: '{{10}}' },
      serverSidePagination: { value: '{{false}}' },
      enableNextButton: { value: '{{true}}' },
      enablePrevButton: { value: '{{true}}' },
      totalRecords: { value: '' },
      enablePagination: { value: '{{true}}' },
      serverSideSort: { value: '{{false}}' },
      serverSideFilter: { value: '{{false}}' },
      displaySearchBox: { value: '{{true}}' },
      showDownloadButton: { value: '{{true}}' },
      showFilterButton: { value: '{{true}}' },
      autogenerateColumns: { value: true, generateNestedColumns: true },
      columns: {
        value: [
          {
            name: 'id',
            id: 'e3ecbf7fa52c4d7210a93edb8f43776267a489bad52bd108be9588f790126737',
            autogenerated: true,
            fxActiveFields: [],
          },
          {
            name: 'name',
            id: '5d2a3744a006388aadd012fcc15cc0dbcb5f9130e0fbb64c558561c97118754a',
            autogenerated: true,
            fxActiveFields: [],
          },
          {
            name: 'email',
            id: 'afc9a5091750a1bd4760e38760de3b4be11a43452ae8ae07ce2eebc569fe9a7f',
            autogenerated: true,
            fxActiveFields: [],
          },
        ],
      },
      showBulkUpdateActions: { value: '{{true}}' },
      showBulkSelector: { value: '{{false}}' },
      highlightSelectedRow: { value: '{{false}}' },
      columnSizes: { value: '{{({})}}' },
      actions: { value: [] },
      enabledSort: { value: '{{true}}' },
      hideColumnSelectorButton: { value: '{{false}}' },
      defaultSelectedRow: { value: '{{{"id":1}}}' },
      showAddNewRowButton: { value: '{{true}}' },
      allowSelection: { value: '{{true}}' },
    },
    events: [],
    styles: {
      textColor: { value: '#000' },
      actionButtonRadius: { value: '0' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      cellSize: { value: 'regular' },
      borderRadius: { value: '4' },
      tableType: { value: 'table-classic' },
    },
  },
};
