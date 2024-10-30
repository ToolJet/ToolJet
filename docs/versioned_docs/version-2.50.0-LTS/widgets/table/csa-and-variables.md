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
| selectAllRows()| Selects all rows on the table.            | Employ a RunJS query (for e.g.,  <br/> `await components.table1.selectAllRows()`) <br/> or trigger it using an event. |
| deselectAllRows() | Deselects all rows on the table| Employ a RunJS query (for e.g.,  <br/> `await components.table1.deselectAllRows()`) <br/> or trigger it using an event. |
| discardChanges()  | Discards the changes from the table when a cell is edited. | Employ a RunJS query (for e.g., <br/> `await components.table1.discardChanges()`) <br/> or trigger it using an event. |
| discardNewlyAddedRows() | Discards the newly added rows from the add new row popup on the table. | Employ a RunJS query (for e.g., <br/> `await components.table1.discardNewlyAddedRows()`) <br/> or trigger it using an event. |
| downloadTableData() | Retrieves the data from the table in the PDF, CSV, or Excel sheet. | Employ a RunJS query (for e.g., <br/> `await components.table1.downloadTableData('pdf')`) <br/> or trigger it using an event. |
| setFilters() | Applies filters to the table data. | Employ a RunJS query (for e.g., <br/> `await components.table1.setFilters ([{column:'name',condition:'contains',value: 'Sarah'}])`) <br/> or trigger it using an event. |
| clearFilters() | Removes all applied filters from the table. | Employ a RunJS query (for e.g., <br/> `await components.table1.clearFilters()`) <br/> or trigger it using an event. |

## Exposed variables

| Variable      | Description |
| :---------- | :---------- |
| currentData     | Data that is currently being displayed by the table (including edits if any). |
| currentPageData  | Data that is displayed on the current page if pagination is enabled (including edits if any).      |
| pageIndex | Index of the current page, starting from 1
| changeSet | Object with row number as the key and object of edited fields and their values as the value. |
| dataUpdates | Similar to `changeSet`, but `dataUpdates` includes data for the entire row that is being edited. |
| selectedRow | Contains the data of the row that was most recently clicked. When an action button is clicked, `selectedRow` is also updated. Its initial value is set to the data of the first row when the app is loaded. |
| selectedRowId | Stores the ID of the row that was last clicked. Similar to `selectedRow`, it gets updated when an action button is clicked. You can access its value using `{{components.table1.selectedRowId}}`. By default, it is set to `0`, representing the ID of the first row when the app is loaded. |
| selectedCell | The data of the cell that was last clicked on the table. |
| searchText | The value of the search field if server-side pagination is enabled. |
| newRows| The newRows variable stores an array of objects, each containing data for a row that was added to the table using the "Add new row" button. When the user clicks either the "Save" or "Discard" button in the modal, this data is cleared.|

If the data in a cell is changed, `changeSet` property of the Table object will have the index of the row and the field that changed.

Along with `changeSet`, `dataUpdates` property will also be changed when the value of a cell changes. `dataUpdates` will have the whole data of the changed index from the Table data. 

If the data of a cell is changed, **Save changes** button will be shown at the bottom of the Table. This button when clicked will trigger the `Bulk update query` event. This event can be used to run a query to update the data on your data source.


