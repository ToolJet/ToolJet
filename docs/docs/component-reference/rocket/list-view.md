---
id: list-view
title: List View
---

<div className="badge badge--primary">Rocket 2.0</div>

The **List View** component shows a list or grid of records, such as people, orders or products, and lets users select one. Each item is built from data fields, or from components designed once and repeated for every record.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| List data | The records to list, for example `{{queries.getItems.data}}`. | Array |
| Layout | Whether items appear in a single-column `list` or a `grid`. | `list`, `grid`. Default: `list` |
| Grid columns | Number of columns when **Layout** is `grid`. | Number. Default: `3` |
| Item content | What each item shows. **Fields** builds the item from the field properties below; **Components** builds the item from components that read the record as `{{listItem}}`. | Fields, Components. Default: Fields |
| Item height (px) | Height of each item when **Item content** is **Components**. An item grows to fit its components. | Number. Default: `72` |
| Gap between items (px) | Space between items in pixels. | Number. Default: `8` |
| Title field | The field shown as the item's title. | Text. Default: `name` |
| Subtitle field | The field shown under the title. Leave empty to hide it. | Text. Default: `email` |
| Avatar field (image URL or a name) | The field used for the avatar. An image URL shows the image; any other text shows its initials. Without a value, the title's initials are used. | Text. Default: `image` |
| Show avatar | Shows an avatar at the start of each item. | On or off. Default: On |
| Badge field (a chip toned by its words) | The field shown as a chip on the right of the item, colored by its text. Leave empty to hide it. | Text. Default: `role` |
| Right-side field | A field shown as text on the right of the item, such as a date or amount. | Text |
| Action button label (empty hides it) | Label of a button on each item. Leave empty to hide the button. | Text. Default: `View` |
| Id field (for selection across data changes) | The field that identifies each record. It keeps the right item selected when the data changes and is used by **Select item**. | Text. Default: `id` |
| Dividers between items (list) | Draws a line between items in a list. It has no effect on outlined items or the grid. | On or off. Default: Off |
| Highlight selected item | Highlights the item the user selected. | On or off. Default: On |
| Pagination | Splits the list into pages with controls at the bottom. | On or off. Default: Off |
| Items per page | Number of items on each page when **Pagination** is on. | Number. Default: `10` |
| Server-side pagination (data is one page) | Treats **List data** as a single page loaded by a query. Use **On page changed** and the page index to fetch the next page. | On or off. Default: Off |
| Total items (server-side) | Total number of records across all pages when **Server-side pagination** is on, used to show the page count. | Number. Default: `0` |
| Empty message | Text shown when there are no items. | Text. Default: `No items` |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** outline of the list. | Spinner, Skeleton. Default: Spinner |

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
| On record clicked | Triggers when the user clicks an item. |
| On page changed | Triggers when the user moves to another page. |
| On action clicked | Triggers when the user clicks an item's action button. The item is selected first, so the handler can read it. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select item | Selects the item whose id matches **Item id** and scrolls to it, moving to its page if needed. It does not fire **On record clicked**. | `components.listview1.selectItem("")` |
| Clear selection | Clears the selected item. | `components.listview1.clearSelection()` |
| Set page | Moves to the given **Page** without firing **On page changed**. | `components.listview1.setPage("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.listview1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.listview1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.listview1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The records to list, for example `{{queries.getItems.data}}`. | `{{components.listview1.data}}` |
| `mode` | Whether items appear in a single-column `list` or a `grid`. | `{{components.listview1.mode}}` |
| `columns` | Number of columns when **Layout** is `grid`. | `{{components.listview1.columns}}` |
| `itemContent` | What each item shows. **Fields** builds the item from the field properties below; **Components** builds the item from components that read the record as `{{listItem}}`. | `{{components.listview1.itemContent}}` |
| `rowHeight` | Height of each item when **Item content** is **Components**. An item grows to fit its components. | `{{components.listview1.rowHeight}}` |
| `gap` | Space between items in pixels. | `{{components.listview1.gap}}` |
| `titleField` | The field shown as the item's title. | `{{components.listview1.titleField}}` |
| `subtitleField` | The field shown under the title. Leave empty to hide it. | `{{components.listview1.subtitleField}}` |
| `imageField` | The field used for the avatar. An image URL shows the image; any other text shows its initials. Without a value, the title's initials are used. | `{{components.listview1.imageField}}` |
| `showAvatar` | Shows an avatar at the start of each item. | `{{components.listview1.showAvatar}}` |
| `badgeField` | The field shown as a chip on the right of the item, colored by its text. Leave empty to hide it. | `{{components.listview1.badgeField}}` |
| `metaField` | A field shown as text on the right of the item, such as a date or amount. | `{{components.listview1.metaField}}` |
| `actionLabel` | Label of a button on each item. Leave empty to hide the button. | `{{components.listview1.actionLabel}}` |
| `idField` | The field that identifies each record. It keeps the right item selected when the data changes and is used by **Select item**. | `{{components.listview1.idField}}` |
| `showBorder` | Draws a line between items in a list. It has no effect on outlined items or the grid. | `{{components.listview1.showBorder}}` |
| `highlightSelectedRow` | Highlights the item the user selected. | `{{components.listview1.highlightSelectedRow}}` |
| `enablePagination` | Splits the list into pages with controls at the bottom. | `{{components.listview1.enablePagination}}` |
| `rowsPerPage` | Number of items on each page when **Pagination** is on. | `{{components.listview1.rowsPerPage}}` |
| `serverSidePagination` | Treats **List data** as a single page loaded by a query. Use **On page changed** and the page index to fetch the next page. | `{{components.listview1.serverSidePagination}}` |
| `totalRecords` | Total number of records across all pages when **Server-side pagination** is on, used to show the page count. | `{{components.listview1.totalRecords}}` |
| `emptyText` | Text shown when there are no items. | `{{components.listview1.emptyText}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** outline of the list. | `{{components.listview1.loadingIndicator}}` |
| `selectedItemId` | The id field value of the selected item. | `{{components.listview1.selectedItemId}}` |
| `selectedItem` | The record of the selected item. | `{{components.listview1.selectedItem}}` |
| `selectedRecord` | The record of the selected item, the same as `selectedItem`. | `{{components.listview1.selectedRecord}}` |
| `selectedRecordId` | The position of the selected item on its page, starting from `0`, or `-1` when nothing is selected. | `{{components.listview1.selectedRecordId}}` |
| `pageIndex` | The current page number, starting from `1`. | `{{components.listview1.pageIndex}}` |
| `isVisible` | Whether the component is visible. | `{{components.listview1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.listview1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.listview1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Accent (selected outline, pagination) | Theme: Brand primary |
| List background | `transparent` |
| Item background | Theme: Surface 1 |
| Item hover background | Theme: Surface 3 |
| Selected item background | Theme: Brand primary |
| Item border color | Theme: Default border |
| Divider color | Theme: Default border |
| Item radius | — |
| Item look | Outlined card |
| Item shadow | None |
| Padding around the list (px) | `0` |
| Empty message color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
