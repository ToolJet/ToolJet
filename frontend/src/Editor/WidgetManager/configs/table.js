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
      validation: {
        schema: { type: 'array', element: { type: 'object' } },
        defaultValue:
          "{{[{name: 'email', key: 'email', id: '1'}, {name: 'Full name', key: 'name', id: '2', isEditable: true}]}}}",
      },
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
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
      },
    },
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop ' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  defaultSize: {
    width: 35,
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
    onTableDataDownload: { displayName: 'Download data' },
  },
  styles: {
    textColor: {
      type: 'color',
      displayName: 'Text Color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000',
      },
      accordian: 'Data',
    },
    columnHeaderWrap: {
      type: 'switch',
      displayName: 'Column header',
      validation: { schema: { type: 'string' } },
      accordian: 'Data',
      options: [
        { displayName: 'Fixed', value: 'fixed' },
        { displayName: 'Wrap', value: 'wrap' },
      ],
    },
    headerCasing: {
      type: 'switch',
      displayName: 'Header casing',
      validation: { schema: { type: 'string' } },
      accordian: 'Data',
      options: [
        { displayName: 'AA', value: 'uppercase' },
        { displayName: 'As typed', value: 'none' },
      ],
    },
    tableType: {
      type: 'select',
      displayName: 'Row style',
      options: [
        { name: 'Regular', value: 'table-classic' },
        { name: 'Bordered', value: 'table-bordered' },
        { name: 'Striped', value: 'table-striped' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'table-classic',
      },
      accordian: 'Data',
    },
    cellSize: {
      type: 'select',
      displayName: 'Cell height',
      options: [
        { name: 'Regular', value: 'regular' },
        { name: 'Condensed', value: 'condensed' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'regular',
      },
      accordian: 'Data',
    },
    contentWrap: {
      type: 'toggle',
      showLabel: false,
      toggleLabel: 'Content wrap',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'boolean' }] },
      },
      accordian: 'Data',
    },
    maxRowHeight: {
      type: 'switch',
      displayName: 'Max row height',
      validation: { schema: { type: 'string' } },
      accordian: 'Data',
      options: [
        { displayName: 'Auto', value: 'auto' },
        { displayName: 'Custom', value: 'custom' },
      ],
      conditionallyRender: {
        key: 'contentWrap',
        value: true,
      },
    },
    maxRowHeightValue: {
      type: 'tableRowHeightInput',
      isFxNotRequired: true,
      showLabel: false,
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
      },
      accordian: 'Data',
      conditionallyRender: [
        {
          key: 'maxRowHeight',
          value: 'custom',
        },
        {
          key: 'contentWrap',
          value: true,
        },
      ],
    },
    actionButtonRadius: {
      type: 'numberInput',
      displayName: 'Button radius',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'boolean' }] },
      },
      accordian: 'Action button',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'Container',
    },
    borderColor: {
      type: 'color',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      accordian: 'Container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'Container',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'Container',
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
          "{{ [ \n\t\t{ id: 1, name: 'Olivia Nguyen', email: 'olivia.nguyen@example.com', date: '15/05/2022', phone: 9876543210, interest: ['Reading', 'Traveling','Photography'], photo: 'https://reqres.in/img/faces/7-image.jpg' }, \n\t\t{ id: 2, name: 'Liam Patel', email: 'liam.patel@example.com', date: '20/09/2021', phone: 8765432109, interest: ['Cooking','Gardening','Hiking'], photo: 'https://reqres.in/img/faces/5-image.jpg' }, \n\t\t{ id: 3, name: 'Sophia Reyes', email: 'sophia.reyes@example.com', date: '01/01/2023', phone: 7654321098, interest: ['Music','Dancing','Crafting'], photo: 'https://reqres.in/img/faces/3-image.jpg' }, \n\t\t{ id: 4, name: 'Jacob Hernandez', email: 'jacob.hernandez@example.com', date: '10/11/2022', phone: 6543210987, interest: ['Reading', 'Traveling', 'Volunteering'], photo: 'https://reqres.in/img/faces/1-image.jpg' }, \n\t\t{ id: 5, name: 'William Sanchez', email: 'william.sanchez@example.com', date: '07/01/2021', phone: 4321098765, interest: ['Music', 'Dancing', 'Hiking'], photo: 'https://reqres.in/img/faces/4-image.jpg' }, \n\t\t{ id: 6, name: 'Ethan Morales', email: 'ethan.morales@example.com', date: '05/11/2021', phone: 2109876543, interest: ['Cooking', 'Traveling', 'Photography'], photo: 'https://reqres.in/img/faces/6-image.jpg' }, \n\t\t{ id: 7, name: 'Mia Tiana', email: 'mia.tiana@example.com', date: '21/11/2022', phone: 1098705217, interest: ['Music', 'Gardening', 'Hiking'], photo: 'https://reqres.in/img/faces/2-image.jpg' }, \n\t\t{ id: 8, name: 'Lucas Ramirez', email: 'lucas.ramirez@example.com', date: '31/03/2023', phone: 9876543210, interest: ['Reading', 'Dancing', 'Crafting'], photo: 'https://reqres.in/img/faces/9-image.jpg' }, \n\t\t{ id: 9, name: 'Alexander Vela', email: 'alexander.vela@example.com', date: '07/09/2022', phone: 7654321098, interest: ['Music','Gardening','Photography'], photo: 'https://reqres.in/img/faces/8-image.jpg' }, \n\t\t{ id: 10, name: 'Michael Reyes', email: 'michael.reyes@example.com', date: '25/12/2021', phone: 5432109876, interest: ['Cooking','Crafting','Volunteering'], photo: 'https://reqres.in/img/faces/10-image.jpg' } \n] }}",
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
      totalRecords: { value: '{{10}}' },
      enablePagination: { value: '{{true}}' },
      serverSideSort: { value: '{{false}}' },
      serverSideFilter: { value: '{{false}}' },
      displaySearchBox: { value: '{{true}}' },
      showDownloadButton: { value: '{{true}}' },
      showFilterButton: { value: '{{true}}' },
      autogenerateColumns: { value: true, generateNestedColumns: true },
      isAllColumnsEditable: { value: '{{false}}' },
      columns: {
        value: [
          {
            name: 'id',
            key: 'id',
            id: 'e3ecbf7fa52c4d7210a93edb8f43776267a489bad52bd108be9588f790126737',
            autogenerated: true,
            fxActiveFields: [],
            columnSize: 30,
            columnType: 'string',
          },
          {
            name: 'photo',
            key: 'photo',
            id: 'f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a2',
            autogenerated: true,
            fxActiveFields: [],
            columnType: 'image',
            objectFit: 'contain',
            borderRadius: '100',
            columnSize: 70,
          },
          {
            name: 'name',
            key: 'name',
            id: '5d2a3744a006388aadd012fcc15cc0dbcb5f9130e0fbb64c558561c97118754a',
            autogenerated: true,
            fxActiveFields: [],
            columnSize: 130,
            columnType: 'string',
          },
          {
            name: 'email',
            key: 'email',
            id: 'afc9a5091750a1bd4760e38760de3b4be11a43452ae8ae07ce2eebc569fe9a7f',
            autogenerated: true,
            fxActiveFields: [],
            columnSize: 230,
            columnType: 'string',
          },
          {
            name: 'date',
            key: 'date',
            id: '27b75c8af9d34d1eaa1f9bb7f8f9f7b0abf1823e799748c8bb57e74f53b2c1dc',
            autogenerated: true,
            fxActiveFields: [],
            columnType: 'datepicker',
            isTimeChecked: false,
            dateFormat: 'DD/MM/YYYY',
            parseDateFormat: 'DD/MM/YYYY',
            isDateSelectionEnabled: true,
            columnSize: 130,
          },
          {
            name: 'mobile_number',
            key: 'mobile_number',
            id: '9c2e3c40572a4aefb8e179ee39a0e1ac9dc2b2e6634be56e1c05be13c3d1de56',
            autogenerated: true,
            fxActiveFields: [],
            columnType: 'number',
            columnSize: 140,
          },
          {
            name: 'interest',
            key: 'interest',
            id: 'f23b7d134b2e490ea41e3bb8eeb8c8e37472af243bf6b70d5af294482097e3a1',
            autogenerated: true,
            fxActiveFields: [],
            columnType: 'newMultiSelect',
            columnSize: 300,
            options: [
              {
                label: 'Reading',
                value: 'Reading',
              },
              {
                label: 'Traveling',
                value: 'Traveling',
              },
              {
                label: 'Photography',
                value: 'Photography',
              },
              {
                label: 'Music',
                value: 'Music',
              },
              {
                label: 'Cooking',
                value: 'Cooking',
              },
              {
                label: 'Crafting',
                value: 'Crafting',
              },
              {
                label: 'Voluntering',
                value: 'Voluntering',
              },
              {
                label: 'Garndening',
                value: 'Garndening',
              },
              {
                label: 'Dancing',
                value: 'Dancing',
              },
              {
                label: 'Hiking',
                value: 'Hiking',
              },
            ],
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
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
    events: [],
    styles: {
      textColor: { value: '#000' },
      columnHeaderWrap: { value: 'fixed' },
      headerCasing: { value: 'uppercase' },
      actionButtonRadius: { value: '0' },
      cellSize: { value: 'regular' },
      borderRadius: { value: '8' },
      tableType: { value: 'table-classic' },
      maxRowHeight: { value: 'auto' },
      maxRowHeightValue: { value: '{{0}}' }, // Setting it here as 0 since TableRowHeightInput component will set the value
      contentWrap: { value: '{{true}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      padding: { value: 'default' },
    },
  },
};
