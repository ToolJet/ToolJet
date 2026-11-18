---
id: table
title: Table
---

<div className="badge badge--primary">Ant Design</div>

The **Table** component is Ant Design's data table. It shows rows of records, such as orders or users from a query, with formatted columns, sorting, pagination and row selection.

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
| On row click | Triggers when the user clicks a row. |
| On change | Triggers when the user changes the page or sorts a column. |
| On selection change | Triggers when the selected rows change through the selection column or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select row | Highlights the row whose **Row key** field matches the given value. With **Row selection** on, it also selects the row, adding it to the selection in `checkbox` mode. | `components.table1.selectRow("")` |
| Clear selection | Clears the clicked row and the selected rows. | `components.table1.clearSelection()` |
| Go to page | Goes to the given **Page (from 1)**. | `components.table1.setCurrent("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.table1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.table1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.table1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.table1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.table1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.table1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
