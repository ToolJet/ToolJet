---
id: list
title: List
---

<div className="badge badge--primary">Ant Design</div>

The **List** component shows records as rows, each with a title, a description and optional avatar and tag, or as rows of your own components. Use it for feeds, notifications or any list users pick an item from.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data source | The records to show, usually a query's data, one row per record. | Array |
| Render item | What each row shows. `meta` shows the fields set below; `components` repeats the components you place in the first row for every record, which read the record as `{{listItem}}`. | Fields (List.Item.Meta), Components. Default: Fields (List.Item.Meta) |
| Title field | Field shown as each row's title. | Text. Default: `title` |
| Description field | Field shown under the title. | Text. Default: `description` |
| Avatar field | Field shown as an avatar at the left. An image URL shows the picture; other text shows its first letter. | Text |
| Extra field | Field shown at the right of the row, such as an amount or a date. | Text |
| Badge field | Field shown as a colored tag at the right. Common status words such as `Paid` or `Overdue` get matching colors. | Text |
| Row height (px) | Height of each row when **Render item** is `components`, in pixels. | Number. Default: `64` |
| Row key | Field that identifies each record, used for the selected item and the **Select item** action. | Text. Default: `id` |
| Header | Text shown above the list. | Text |
| Footer | Text shown below the list. | Text |
| Bordered | Draws a border around the list. | On or off. Default: On |
| Split | Draws a line between rows. | On or off. Default: On |
| Size | Padding of each row. | `default`, `small`, `large`. Default: `default` |
| Page size | Number of rows per page, with page controls under the list. Leave it at `0` to show every row. | Number. Default: `0` |
| Empty text | Message shown when there are no records. | Text. Default: `No data` |

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
| On item click | Triggers when the user clicks a row. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select item | Selects the row whose **Row key** field matches the given value and moves to its page. It doesn't fire **On item click**. | `components.list1.selectItem("")` |
| Clear selection | Clears the selected row. | `components.list1.clearSelection()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.list1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.list1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.list1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `dataSource` | The records to show, usually a query's data, one row per record. | `{{components.list1.dataSource}}` |
| `renderItem` | What each row shows. `meta` shows the fields set below; `components` repeats the components you place in the first row for every record, which read the record as `{{listItem}}`. | `{{components.list1.renderItem}}` |
| `titleField` | Field shown as each row's title. | `{{components.list1.titleField}}` |
| `descriptionField` | Field shown under the title. | `{{components.list1.descriptionField}}` |
| `avatarField` | Field shown as an avatar at the left. An image URL shows the picture; other text shows its first letter. | `{{components.list1.avatarField}}` |
| `extraField` | Field shown at the right of the row, such as an amount or a date. | `{{components.list1.extraField}}` |
| `badgeField` | Field shown as a colored tag at the right. Common status words such as `Paid` or `Overdue` get matching colors. | `{{components.list1.badgeField}}` |
| `rowHeight` | Height of each row when **Render item** is `components`, in pixels. | `{{components.list1.rowHeight}}` |
| `rowKey` | Field that identifies each record, used for the selected item and the **Select item** action. | `{{components.list1.rowKey}}` |
| `header` | Text shown above the list. | `{{components.list1.header}}` |
| `footer` | Text shown below the list. | `{{components.list1.footer}}` |
| `bordered` | Draws a border around the list. | `{{components.list1.bordered}}` |
| `split` | Draws a line between rows. | `{{components.list1.split}}` |
| `size` | Padding of each row. | `{{components.list1.size}}` |
| `pageSize` | Number of rows per page, with page controls under the list. Leave it at `0` to show every row. | `{{components.list1.pageSize}}` |
| `emptyText` | Message shown when there are no records. | `{{components.list1.emptyText}}` |
| `selectedItem` | The record of the selected row. It is empty when nothing is selected. | `{{components.list1.selectedItem}}` |
| `selectedItemKey` | Value of **Row key** for the selected row. | `{{components.list1.selectedItemKey}}` |
| `isVisible` | Whether the component is visible. | `{{components.list1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.list1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.list1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
