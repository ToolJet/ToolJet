---
id: data-table
title: Data Table
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Data Table** component shows rows of data in columns, with search, sorting, filters, pagination and row selection. Use it to list records from a query, such as orders or users, and to act on the rows people pick.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Table data | The rows to show, as an array of objects, for example `{{queries.getOrders.data}}`. | Array |
| Columns (empty: from the data) | The columns to show and how each one is formatted, such as text, currency, date, badge or button. Leave it empty to build one column per field in the data. | Array |
| Row id field | The field that identifies each row. The table uses it to keep the same records selected when the data reloads. | Text. Default: `id` |
| Pagination | Splits the rows into pages with page controls in the footer. | On or off. Default: On |
| Rows per page | How many rows each page shows. | Number. Default: `10` |
| Server-side pagination (data is one page) | Treats **Table data** as one page at a time. Use the **Page changed** event and the `pageIndex` value to fetch each page from your query. | On or off. Default: Off |
| Total records (server-side) | The total number of rows across all pages when pagination is server-side. The table uses it for the page count and the row count. | Number. Default: `0` |
| Previous page enabled (server-side) | Turns the previous page button on or off when pagination is server-side. | On or off. Default: On |
| Next page enabled (server-side) | Turns the next page button on or off when pagination is server-side. | On or off. Default: On |
| Search box | Shows a search box above the table that matches text in the visible columns. | On or off. Default: On |
| Search placeholder | Hint text shown in the empty search box. | Text. Default: `Search…` |
| Filter button text | Text on the filter button. | Text. Default: `Filter` |
| Columns button text | Text on the button that lets users show or hide columns. | Text. Default: `Columns` |
| Row count text | Text for the row count in the footer. `{count}` is replaced by the number of rows. | Text. Default: `{count} rows` |
| No matching rows message | Message shown when a search or filter matches no rows. | Text. Default: `No matching rows.` |
| Server-side search | Leaves searching to your query: the table stops filtering rows itself and only reports the text in `searchText`. | On or off. Default: Off |
| Column sorting | Lets users sort by a column by clicking its header. Each click cycles through ascending, descending and no sort. | On or off. Default: On |
| Server-side sort | Leaves sorting to your query: the table stops reordering rows itself and only reports the sort in `sortApplied`. | On or off. Default: Off |
| Filter button | Shows the filter button, where users add conditions on columns. | On or off. Default: On |
| Server-side filters | Leaves filtering to your query: the table stops filtering rows itself and only reports the conditions in `filters`. | On or off. Default: Off |
| Row selection | Lets users select a row by clicking it. | On or off. Default: On |
| Bulk selection (checkboxes) | Adds a checkbox to each row and to the header so users can select several rows at once. | On or off. Default: Off |
| Highlight selected row | Shades the selected row so it stands out. | On or off. Default: On |
| Keep a row selected (no deselect) | Keeps a row selected when the user clicks it again. Turn it off to let a second click clear the selection. | On or off. Default: On |
| Default selected row (\{ key: value \}) | The row selected when the data loads, matched by one field and value, for example `{ id: 1 }`. | Object |
| Hide column chooser | Hides the button that lets users show or hide columns. | On or off. Default: Off |
| Download button | Shows a download button that saves the current rows, after search, filters and sorting, as a CSV or JSON file. | On or off. Default: Off |
| Refresh button | Shows a refresh button that fires the **Refresh** event, so you can rerun the query that fills the table. | On or off. Default: Off |
| Row count in the footer | Shows the number of rows in the footer. | On or off. Default: On |
| Row height | Height of each row. | Condensed, Regular, Spacious. Default: Regular |
| Rows | Row style. **Striped** shades every other row; **Bordered** draws lines between cells. | Regular, Striped, Bordered. Default: Regular |
| Sticky header (scrolls inside) | Keeps the column headers in view while the rows scroll. | On or off. Default: On |
| Currency (currency columns) | Currency code used by currency columns that don't set their own, for example `USD` or `EUR`. | Text. Default: `USD` |
| Number locale | Locale used to format numbers and currency in columns that don't set their own, for example `en-US` or `de-DE`. | Text. Default: `en-US` |
| Date format (date columns) | Format used by date columns that don't set their own, for example `DD MMM YYYY`. | Text. Default: `DD MMM YYYY` |
| Badge colours by value | Colors for badge columns by cell value, for example `{ Paid: '#16a34a', Overdue: '#dc2626' }`. A column's own colors take priority. | Object |
| Empty message | Message shown when the table has no rows. | Text. Default: `No results.` |
| Empty description | A second line under the empty message. | Text |
| Loading look | What the table shows while it is loading: a spinner or skeleton rows. | Spinner, Skeleton. Default: Spinner |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| Row clicked | Triggers when the user clicks a row. |
| Selection changed | Triggers when the selected rows change, from a click, a checkbox or a selection action. |
| Action button clicked | Triggers when the user clicks a button in a button column. The row the button is on is selected first. |
| Search | Triggers when the search text changes, shortly after the user stops typing. |
| Sort applied | Triggers when the sort changes, from a header click or the **Set sort** action. |
| Filter changed | Triggers when the filters change, from the filter button or a filter action. |
| Page changed | Triggers when the user moves to another page or **Set page** changes the page. |
| Refresh | Triggers when the user clicks the refresh button. |
| Row hovered | Triggers when the pointer moves onto a row. |
| Header clicked | Triggers when the user clicks a column header. |
| Table data downloaded | Triggers when the table data is downloaded, from the download button or the **Download table data** action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set page | Moves to the page given in **Page (1-based)**. | `components.datatable1.setPage("{{1}}")` |
| Select row | Selects the first row whose **Key** field equals **Value**. | `components.datatable1.selectRow("id", "")` |
| Deselect row | Clears the row selection. | `components.datatable1.deselectRow()` |
| Select rows | Selects the rows whose **Key** field matches any of **Values**. With bulk selection off, only the first match is selected. | `components.datatable1.selectRows("id", "{{[]}}")` |
| Deselect rows | Deselects the rows whose **Key** field matches any of **Values**. | `components.datatable1.deselectRows("id", "{{[]}}")` |
| Select all rows | Selects every row that matches the current search and filters. It works only when **Bulk selection (checkboxes)** is on. | `components.datatable1.selectAllRows()` |
| Deselect all rows | Clears the row selection. | `components.datatable1.deselectAllRows()` |
| Set filters | Replaces the filters with the list in **Filters**, for example `[{ column: 'status', condition: 'equals', value: 'Paid' }]`, and returns to the first page. | `components.datatable1.setFilters("{{[{ column: 'status', condition: 'equals', value: 'Paid' }]}}")` |
| Clear filters | Removes all filters. | `components.datatable1.clearFilters()` |
| Set sort | Sorts by the column in **Column key**, in the **Direction** `asc` or `desc`. Any other direction removes the sort. | `components.datatable1.setSort("", "asc")` |
| Set search text | Sets the search text and searches the table. | `components.datatable1.setSearchText("")` |
| Download table data | Downloads the current rows as a CSV or JSON file, depending on **Type (csv or json)**. | `components.datatable1.downloadTableData("csv")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.datatable1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.datatable1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.datatable1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The rows to show, as an array of objects, for example `{{queries.getOrders.data}}`. | `{{components.datatable1.data}}` |
| `columns` | The columns to show and how each one is formatted, such as text, currency, date, badge or button. Leave it empty to build one column per field in the data. | `{{components.datatable1.columns}}` |
| `idField` | The field that identifies each row. The table uses it to keep the same records selected when the data reloads. | `{{components.datatable1.idField}}` |
| `enablePagination` | Splits the rows into pages with page controls in the footer. | `{{components.datatable1.enablePagination}}` |
| `rowsPerPage` | How many rows each page shows. | `{{components.datatable1.rowsPerPage}}` |
| `serverSidePagination` | Treats **Table data** as one page at a time. Use the **Page changed** event and the `pageIndex` value to fetch each page from your query. | `{{components.datatable1.serverSidePagination}}` |
| `totalRecords` | The total number of rows across all pages when pagination is server-side. The table uses it for the page count and the row count. | `{{components.datatable1.totalRecords}}` |
| `enablePrevButton` | Turns the previous page button on or off when pagination is server-side. | `{{components.datatable1.enablePrevButton}}` |
| `enableNextButton` | Turns the next page button on or off when pagination is server-side. | `{{components.datatable1.enableNextButton}}` |
| `displaySearchBox` | Shows a search box above the table that matches text in the visible columns. | `{{components.datatable1.displaySearchBox}}` |
| `searchPlaceholder` | Hint text shown in the empty search box. | `{{components.datatable1.searchPlaceholder}}` |
| `filterLabel` | Text on the filter button. | `{{components.datatable1.filterLabel}}` |
| `columnsLabel` | Text on the button that lets users show or hide columns. | `{{components.datatable1.columnsLabel}}` |
| `rowCountLabel` | Text for the row count in the footer. `{count}` is replaced by the number of rows. | `{{components.datatable1.rowCountLabel}}` |
| `noMatchText` | Message shown when a search or filter matches no rows. | `{{components.datatable1.noMatchText}}` |
| `serverSideSearch` | Leaves searching to your query: the table stops filtering rows itself and only reports the text in `searchText`. | `{{components.datatable1.serverSideSearch}}` |
| `enabledSort` | Lets users sort by a column by clicking its header. Each click cycles through ascending, descending and no sort. | `{{components.datatable1.enabledSort}}` |
| `serverSideSort` | Leaves sorting to your query: the table stops reordering rows itself and only reports the sort in `sortApplied`. | `{{components.datatable1.serverSideSort}}` |
| `showFilterButton` | Shows the filter button, where users add conditions on columns. | `{{components.datatable1.showFilterButton}}` |
| `serverSideFilter` | Leaves filtering to your query: the table stops filtering rows itself and only reports the conditions in `filters`. | `{{components.datatable1.serverSideFilter}}` |
| `allowSelection` | Lets users select a row by clicking it. | `{{components.datatable1.allowSelection}}` |
| `showBulkSelector` | Adds a checkbox to each row and to the header so users can select several rows at once. | `{{components.datatable1.showBulkSelector}}` |
| `highlightSelectedRow` | Shades the selected row so it stands out. | `{{components.datatable1.highlightSelectedRow}}` |
| `disableRowDeselection` | Keeps a row selected when the user clicks it again. Turn it off to let a second click clear the selection. | `{{components.datatable1.disableRowDeselection}}` |
| `defaultSelectedRow` | The row selected when the data loads, matched by one field and value, for example `{ id: 1 }`. | `{{components.datatable1.defaultSelectedRow}}` |
| `hideColumnSelectorButton` | Hides the button that lets users show or hide columns. | `{{components.datatable1.hideColumnSelectorButton}}` |
| `showDownloadButton` | Shows a download button that saves the current rows, after search, filters and sorting, as a CSV or JSON file. | `{{components.datatable1.showDownloadButton}}` |
| `showRefreshButton` | Shows a refresh button that fires the **Refresh** event, so you can rerun the query that fills the table. | `{{components.datatable1.showRefreshButton}}` |
| `showRowCount` | Shows the number of rows in the footer. | `{{components.datatable1.showRowCount}}` |
| `cellSize` | Height of each row. | `{{components.datatable1.cellSize}}` |
| `tableType` | Row style. **Striped** shades every other row; **Bordered** draws lines between cells. | `{{components.datatable1.tableType}}` |
| `stickyHeader` | Keeps the column headers in view while the rows scroll. | `{{components.datatable1.stickyHeader}}` |
| `currency` | Currency code used by currency columns that don't set their own, for example `USD` or `EUR`. | `{{components.datatable1.currency}}` |
| `locale` | Locale used to format numbers and currency in columns that don't set their own, for example `en-US` or `de-DE`. | `{{components.datatable1.locale}}` |
| `dateFormat` | Format used by date columns that don't set their own, for example `DD MMM YYYY`. | `{{components.datatable1.dateFormat}}` |
| `badgeColors` | Colors for badge columns by cell value, for example `{ Paid: '#16a34a', Overdue: '#dc2626' }`. A column's own colors take priority. | `{{components.datatable1.badgeColors}}` |
| `emptyText` | Message shown when the table has no rows. | `{{components.datatable1.emptyText}}` |
| `emptyDescription` | A second line under the empty message. | `{{components.datatable1.emptyDescription}}` |
| `loadingIndicator` | What the table shows while it is loading: a spinner or skeleton rows. | `{{components.datatable1.loadingIndicator}}` |
| `selectedRow` | The row selected or last clicked, as an object. | `{{components.datatable1.selectedRow}}` |
| `selectedRowId` | The position of the selected row in **Table data**, starting at `0`. | `{{components.datatable1.selectedRowId}}` |
| `selectedRows` | All selected rows, as an array of objects. | `{{components.datatable1.selectedRows}}` |
| `selectedRowsId` | The positions of the selected rows in **Table data**. | `{{components.datatable1.selectedRowsId}}` |
| `pageIndex` | The current page number, starting at `1`. | `{{components.datatable1.pageIndex}}` |
| `searchText` | The text in the search box. | `{{components.datatable1.searchText}}` |
| `sortApplied` | The current sort, as `[{ column, columnKey, direction }]`, or an empty array. | `{{components.datatable1.sortApplied}}` |
| `filters` | The current filters, as an array of `{ column, columnKey, condition, value }`. | `{{components.datatable1.filters}}` |
| `currentData` | All rows after search, filters and sorting, across every page. | `{{components.datatable1.currentData}}` |
| `currentPageData` | The rows on the current page. | `{{components.datatable1.currentPageData}}` |
| `filteredData` | All rows after search, filters and sorting, across every page. | `{{components.datatable1.filteredData}}` |
| `lastActionClicked` | The last button clicked in a button column, with its `buttonId`, `columnKey`, `columnName` and `row`. | `{{components.datatable1.lastActionClicked}}` |
| `hoveredRow` | The row under the pointer, as an object. | `{{components.datatable1.hoveredRow}}` |
| `hoveredRowId` | The position of the hovered row in **Table data**. | `{{components.datatable1.hoveredRowId}}` |
| `selectedColumnHeader` | The column header last clicked, with its `name` and `key`. | `{{components.datatable1.selectedColumnHeader}}` |
| `isVisible` | Whether the component is visible. | `{{components.datatable1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.datatable1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.datatable1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Table shadow | `0px 0px 0px 0px #00000040` |
| Accent (checkboxes, focus, active page) | Theme: Brand primary |
| Table background | Theme: Surface 1 |
| Header row background | Theme: Surface 1 |
| Header text color | Theme: Placeholder text |
| Cell text color | Theme: Primary text |
| Secondary text color (footer, empty state) | Theme: Placeholder text |
| Border and row divider color | Theme: Default border |
| Row hover background | Theme: Surface 3 |
| Selected row background | Theme: Brand primary |
| Striped row background | Theme: Surface 3 |
| Table radius | — |
| Font size (px) | `14` |
| Header casing | As typed |
| Border around the table | On |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
