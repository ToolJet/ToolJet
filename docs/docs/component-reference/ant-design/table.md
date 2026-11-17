---
id: table
title: Table
---

<div className="badge badge--primary">Ant Design</div>

The **Table** component is Ant Design's data table. It shows rows of records, such as orders or users from a query, with formatted columns, sorting, pagination and row selection.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data source | Rows to show, such as `{{queries.getOrders.data}}`. | Array |
| Columns | The columns, each with a `title` and the `dataIndex` field it shows, plus optional `format`, `align`, `width` and `sorter`. `format` can be `number`, `currency` (or `currency:EUR`), `percent`, `date`, `datetime`, `tag`, `boolean` or `html`. Leave it empty to show every field. | Array |
| Title | Heading shown above the rows. `{count}` is replaced with the number of rows. | Text |
| Row key | Field that identifies each row, such as `id`. **selectedRowKeys** and **Select row** use it. | Text. Default: `id` |
| Pagination | Splits the rows into pages with page buttons under the table. | On or off. Default: On |
| Page size | Number of rows on each page. | Number. Default: `10` |
| Bordered | Draws borders around the table and between cells. | On or off. Default: Off |
| Size | Spacing of the rows and cells. | `large`, `middle`, `small`. Default: `middle` |
| Show header | Shows the row of column titles. | On or off. Default: On |
| Row selection | Adds a selection column. `checkbox` lets the user select several rows; `radio` selects one. | `none`, `checkbox`, `radio`. Default: `none` |
| Empty text | Text shown when there are no rows. | Text. Default: `No data` |
| Currency | Currency code, such as `USD` or `EUR`, for `currency` columns that don't name one. | Text. Default: `USD` |
| Locale | Locale for number and date formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Tag colors | Colors for values in `tag` columns, such as `{ "Paid": "green" }`. Without one, words such as Paid or Overdue get a matching status color. | Object |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On row click](../common-settings.md#events) | Triggers when the user clicks a row. |
| [On change](../common-settings.md#events) | Triggers when the user changes the page or sorts a column. |
| [On selection change](../common-settings.md#events) | Triggers when the selected rows change through the selection column or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select row | Highlights the row whose **Row key** field matches the given value. With **Row selection** on, it also selects the row, adding it to the selection in `checkbox` mode. | `components.table1.selectRow("")` |
| Clear selection | Clears the clicked row and the selected rows. | `components.table1.clearSelection()` |
| Go to page | Goes to the given **Page (from 1)**. | `components.table1.setCurrent("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `dataSource` | Rows to show, such as `{{queries.getOrders.data}}`. | `{{components.table1.dataSource}}` |
| `columns` | The columns, each with a `title` and the `dataIndex` field it shows, plus optional `format`, `align`, `width` and `sorter`. `format` can be `number`, `currency` (or `currency:EUR`), `percent`, `date`, `datetime`, `tag`, `boolean` or `html`. Leave it empty to show every field. | `{{components.table1.columns}}` |
| `title` | Heading shown above the rows. `{count}` is replaced with the number of rows. | `{{components.table1.title}}` |
| `rowKey` | Field that identifies each row, such as `id`. **selectedRowKeys** and **Select row** use it. | `{{components.table1.rowKey}}` |
| `pagination` | Splits the rows into pages with page buttons under the table. | `{{components.table1.pagination}}` |
| `pageSize` | Number of rows on each page. | `{{components.table1.pageSize}}` |
| `bordered` | Draws borders around the table and between cells. | `{{components.table1.bordered}}` |
| `size` | Spacing of the rows and cells. | `{{components.table1.size}}` |
| `showHeader` | Shows the row of column titles. | `{{components.table1.showHeader}}` |
| `rowSelection` | Adds a selection column. `checkbox` lets the user select several rows; `radio` selects one. | `{{components.table1.rowSelection}}` |
| `emptyText` | Text shown when there are no rows. | `{{components.table1.emptyText}}` |
| `currency` | Currency code, such as `USD` or `EUR`, for `currency` columns that don't name one. | `{{components.table1.currency}}` |
| `locale` | Locale for number and date formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.table1.locale}}` |
| `tagColors` | Colors for values in `tag` columns, such as `{ "Paid": "green" }`. Without one, words such as Paid or Overdue get a matching status color. | `{{components.table1.tagColors}}` |
| `selectedRow` | The data of the row the user clicked last, or `{}`. | `{{components.table1.selectedRow}}` |
| `selectedRowKeys` | **Row key** values of the rows selected in the selection column. | `{{components.table1.selectedRowKeys}}` |
| `selectedRows` | The data of the rows selected in the selection column. | `{{components.table1.selectedRows}}` |
| `current` | The page shown, counting from 1. | `{{components.table1.current}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
