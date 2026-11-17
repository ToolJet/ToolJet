---
id: record-list
title: Record List
---

<div className="badge badge--primary">Ant Design</div>

The **Record List** component shows records as a list of rows, each with a title, details, a status tag and a value, such as users, customers or orders. Users click a row to select it.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data source | Records to list, one row each, such as the data from a query. | Array |
| Title field | Field shown as each row's title. | Text. Default: `name` |
| Avatar field | Field that holds an image URL or a name for the avatar. A name shows its initials. | Text |
| Meta fields | Fields shown under the title, joined with a dot, such as `['email', 'role']`. | Array. Default: `["email", "role"]` |
| Status field | Field shown as a status tag at the right. Common words such as Active, Pending or Overdue get matching colors. | Text. Default: `status` |
| Progress field | Field with a percentage shown as a small progress bar under the title. | Text |
| Value field | Field shown as a bold value at the right, such as an amount. | Text |
| Value format | How **Value field** is written. `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `auto`, `number`, `currency`, `percent`, `compact`, `date`, `datetime`. Default: `auto` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Value format** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Status colors | Colors for status values, such as `{ "Invited": "blue", "Suspended": "red" }`. They override the automatic colors. | Object |
| Id field | Field that identifies each record. It's read into **selectedItemId**. | Text. Default: `id` |
| Show avatar | Shows the avatar when **Avatar field** is set. | On or off. Default: On |
| Avatar shape | Shape of the avatars. | `circle`, `square`. Default: `circle` |
| Size | Spacing of the rows. | `small`, `default`, `large`. Default: `default` |
| Split | Draws a divider line between rows. | On or off. Default: On |
| Bordered | Draws a border around the list. | On or off. Default: On |
| Empty text | Text shown when there are no records. | Text. Default: `No records` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On item clicked](../common-settings.md#events) | Triggers when the user clicks a row to select it. Clicking the selected row again clears the selection without triggering the event. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear selection | Clears the selected row. | `components.recordlist1.clearSelection()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `dataSource` | Records to list, one row each, such as the data from a query. | `{{components.recordlist1.dataSource}}` |
| `titleField` | Field shown as each row's title. | `{{components.recordlist1.titleField}}` |
| `avatarField` | Field that holds an image URL or a name for the avatar. A name shows its initials. | `{{components.recordlist1.avatarField}}` |
| `metaFields` | Fields shown under the title, joined with a dot, such as `['email', 'role']`. | `{{components.recordlist1.metaFields}}` |
| `statusField` | Field shown as a status tag at the right. Common words such as Active, Pending or Overdue get matching colors. | `{{components.recordlist1.statusField}}` |
| `progressField` | Field with a percentage shown as a small progress bar under the title. | `{{components.recordlist1.progressField}}` |
| `valueField` | Field shown as a bold value at the right, such as an amount. | `{{components.recordlist1.valueField}}` |
| `valueFormat` | How **Value field** is written. `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `{{components.recordlist1.valueFormat}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Value format** is `currency`. | `{{components.recordlist1.currency}}` |
| `locale` | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.recordlist1.locale}}` |
| `statusColors` | Colors for status values, such as `{ "Invited": "blue", "Suspended": "red" }`. They override the automatic colors. | `{{components.recordlist1.statusColors}}` |
| `idField` | Field that identifies each record. It's read into **selectedItemId**. | `{{components.recordlist1.idField}}` |
| `showAvatar` | Shows the avatar when **Avatar field** is set. | `{{components.recordlist1.showAvatar}}` |
| `avatarShape` | Shape of the avatars. | `{{components.recordlist1.avatarShape}}` |
| `size` | Spacing of the rows. | `{{components.recordlist1.size}}` |
| `split` | Draws a divider line between rows. | `{{components.recordlist1.split}}` |
| `bordered` | Draws a border around the list. | `{{components.recordlist1.bordered}}` |
| `emptyText` | Text shown when there are no records. | `{{components.recordlist1.emptyText}}` |
| `selectedItemId` | Value of **Id field** in the item the user clicked, or empty when nothing is selected. | `{{components.recordlist1.selectedItemId}}` |
| `selectedItem` | The full data row of the item the user clicked, or `{}` when nothing is selected. | `{{components.recordlist1.selectedItem}}` |
| `selectedItemIndex` | Position of the clicked item in **Data source**, counting from 0, or `-1` when nothing is selected. | `{{components.recordlist1.selectedItemIndex}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
