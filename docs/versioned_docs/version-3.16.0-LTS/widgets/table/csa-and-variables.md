---
id: table-csa-and-variables
title: Component Specific Actions (CSA) and Exposed Variables
---

## Component specific actions (CSA)

The following actions of the Table component can be controlled using the component specific actions(CSA):

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"135px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div>|
| :------------ | :---------- | :------------ |
| setPage()      | Sets the page on the table.   | Employ a RunJS query (for e.g.,  <br/> `await components.table1.setPage(2)`) <br/> or trigger it using an event. |
| selectRow()    | Selects a row on the table | Employ a RunJS query (for e.g.,  <br/> `await components.table1.selectRow('id','11')`) <br/> or trigger it using an event. |
| deselectRow()  | Deselects a row on the table. | Employ a RunJS query (for e.g.,  <br/> `await components.table1.deselectRow()`)  <br/> or trigger it using an event. |
| selectRows() | Selects the rows whose value in the given column key matches one of the given values. Adds to the current selection. Accepts an array or a single value. | Employ a RunJS query (for e.g., <br/> `await components.table1.selectRows('id', [1, 3])`) <br/> or trigger it using an event. |
| deselectRows() | Deselects the rows whose value in the given column key matches one of the given values. Other selected rows stay selected. | Employ a RunJS query (for e.g., <br/> `await components.table1.deselectRows('id', [1])`) <br/> or trigger it using an event. |
| selectAllRows()| Selects all rows on the table.            | Employ a RunJS query (for e.g.,  <br/> `await components.table1.selectAllRows()`) <br/> or trigger it using an event. |
| deselectAllRows() | Deselects all rows on the table| Employ a RunJS query (for e.g.,  <br/> `await components.table1.deselectAllRows()`) <br/> or trigger it using an event. |
| discardChanges()  | Discards the changes from the table when a cell is edited. | Employ a RunJS query (for e.g., <br/> `await components.table1.discardChanges()`) <br/> or trigger it using an event. |
| discardNewlyAddedRows() | Discards the newly added rows from the add new row popup on the table. | Employ a RunJS query (for e.g., <br/> `await components.table1.discardNewlyAddedRows()`) <br/> or trigger it using an event. |
| downloadTableData() | Retrieves the data from the table in the PDF, CSV, or Excel sheet. | Employ a RunJS query (for e.g., <br/> `await components.table1.downloadTableData('pdf')`) <br/> or trigger it using an event. |
| setFilters() | Applies filters to the table data. | Employ a RunJS query (for e.g., <br/> `await components.table1.setFilters ([{column:'name',condition:'contains',value: 'Sarah'}])`) <br/> or trigger it using an event. |
| clearFilters() | Removes all applied filters from the table. | Employ a RunJS query (for e.g., <br/> `await components.table1.clearFilters()`) <br/> or trigger it using an event. |
| setSort() | Programmatically sets the sort state of the table by column key and direction. Use `'auto'` to toggle the sort direction automatically. | Employ a RunJS query (for e.g., <br/> `await components.table1.setSort('name', 'asc')`) <br/> or trigger it using an event. |
| setVisibility() | Sets the visibility of the component. | Employ a RunJS query (for e.g., <br/> `await components.table1.setVisibility(false)`) <br/> or trigger it using an event. |
| setLoading() | Sets the loading state of the component. | Employ a RunJS query (for e.g., <br/> `await components.table1.setLoading(true)`) <br/> or trigger it using an event. |
| setDisable() | Disables the component. | Employ a RunJS query (for e.g., <br/> `await components.table1.setDisable(true)`) <br/> or trigger it using an event. |

## Exposed variables

| Variable             | Description |
| :------------------- | :---------- |
| currentData          | Data that is currently being displayed by the table (including edits if any). |
| currentPageData      | Data that is displayed on the current page if pagination is enabled (including edits if any). |
| filteredData         | Data after search and filters are applied, across all pages. |
| pageIndex            | Index of the current page, starting from 1. |
| changeSet            | Object with row number as the key and object of edited fields and their values as the value. |
| dataUpdates          | Similar to `changeSet`, but `dataUpdates` includes data for the entire row that is being edited. |
| updatedData          | The complete table data with the edited rows merged in. |
| selectedRow          | Contains the data of the row that was most recently clicked. When an action button is clicked, `selectedRow` is also updated. Its initial value is set to the data of the first row when the app is loaded. |
| selectedRowId        | Stores the ID of the row that was last clicked. Similar to `selectedRow`, it gets updated when an action button is clicked. You can access its value using `{{components.table1.selectedRowId}}`. By default, it is set to `0`, representing the ID of the first row when the app is loaded. |
| selectedRows         | Array of the rows selected with checkboxes. Populated when **Allow selection** and **Bulk selection** are on; otherwise an empty array. |
| selectedRowsId       | Array of the IDs of the rows in `selectedRows`, in the same order. |
| selectedCell         | The data of the cell that was last clicked on the table. |
| hoveredRow           | The data of the row under the mouse pointer. Updated only when a **Row hovered** event handler is configured. |
| hoveredRowId         | The ID of the row under the mouse pointer. Updated only when a **Row hovered** event handler is configured. |
| searchText           | The value of the search field if server-side pagination is enabled. |
| filters              | Array of the applied filters. Each item has `column` (the column name), `condition` and `value`. |
| sortApplied          | Array with the applied sort, for example `[{ column: 'Name', columnKey: 'name', direction: 'asc' }]`. Empty when no sort is applied. |
| newRows              | The newRows variable stores an array of objects, each containing data for a row that was added to the table using the "Add new row" button. When the user clicks either the "Save" or "Discard" button in the modal, this data is cleared. |
| lastExpandedRow      | The index of the most recently expanded row. Updated whenever a row is expanded. Only populated when **Enable expandable rows** is turned on. |
| currentExpandedRows  | An array of row indices that are currently expanded. Updated on every expand or collapse action. Only populated when **Enable expandable rows** is turned on. |
| selectedColumnHeader | An object updated when a column header is clicked. Contains three fields: `key` (the column's data key), `name` (the column's display name), and `index` (the column's position from the left). Updated before the **Header clicked** event fires. |
| isVisible            | Indicates if the component is visible. |
| isDisabled           | Indicates if the component is disabled. |
| isLoading            | Indicates if the component is loading, including while the refresh button re-runs the query. |

If the data in a cell is changed, `changeSet` property of the Table object will have the index of the row and the field that changed.

Along with `changeSet`, `dataUpdates` property will also be changed when the value of a cell changes. `dataUpdates` will have the whole data of the changed index from the Table data. 

If the data of a cell is changed, **Save changes** button will be shown at the bottom of the Table. This button when clicked will trigger the `Bulk update query` event. This event can be used to run a query to update the data on your data source.


