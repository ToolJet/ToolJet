---
id: record-list
title: Record List
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Record List** component shows rows of data as a compact list, each with an avatar, a title, a line of details, a status chip and a value on the right. Use it for invoices, customers, tickets or any records the user picks from.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to list, one item per row. | Array |
| Title field | Field shown as the bold title of each item. | Text. Default: `customer` |
| Avatar field (image URL or a name; empty uses the title) | Field with an image URL, or a name to show as initials. Leave empty to use the initials of the title. | Text |
| Meta fields (comma list; 'total\|currency', 'due\|date:Due \{\}') | Comma-separated fields shown on the line under the title. Add a format after a pipe (`total\|currency`, `due\|date`) and a label after a colon, where `{}` marks the value (`due\|date:Due {}`). | Text. Default: `contact, due\|date:Due {}` |
| Status field (a chip toned by its words) | Field shown as a chip. Common words such as `Paid` or `Overdue` get a matching color. | Text. Default: `status` |
| Progress field (a percentage, 0 to 100) | Field with a percent from `0` to `100`, shown as a small progress bar. | Text |
| Trailing value field | Field shown on the right of each item, such as an amount. | Text. Default: `total` |
| Trailing value format | How the value on the right is written, such as currency, a short number like `12K`, or a date. | `auto`, `number`, `currency`, `percent`, `compact`, `date`, `datetime`. Default: `currency` |
| Currency (ISO code, e.g. USD) | Currency code used when a value is formatted as currency, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Locale used to format numbers, currency and dates, such as `en-US`. Leave empty to follow the currency. | Text |
| Status colors | A color for each status value, for example `{ "Paid": "#16a34a" }`. Overrides the automatic color. | Object |
| Id field | Field that identifies each row. It fills **selectedItemId** when the user clicks an item. | Text. Default: `id` |
| Show avatar | Shows the avatar at the start of each item. | On or off. Default: On |
| Avatar shape | Shape of the avatars. | `circle`, `rounded`. Default: `circle` |
| Density | Spacing of the items, from **compact** to **comfortable**. | `compact`, `default`, `comfortable`. Default: `default` |
| Show dividers | Draws a line between items. | On or off. Default: On |
| List style | **Card** draws the list in a bordered box; **Plain** shows the items without one. | `card`, `plain`. Default: `card` |
| Highlight the selected row | Marks the clicked item as selected. Clicking it again clears the selection. | On or off. Default: On |
| Empty text | Message shown when there are no rows. | Text. Default: `Nothing here yet` |
| Loading look | What shows while the list is loading: a spinner or skeleton rows. | Spinner, Skeleton. Default: Spinner |

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
| On item clicked | Triggers when the user clicks an item. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear selection | Clears the selected item. | `components.recordlist1.clearSelection()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.recordlist1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.recordlist1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.recordlist1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to list, one item per row. | `{{components.recordlist1.data}}` |
| `titleField` | Field shown as the bold title of each item. | `{{components.recordlist1.titleField}}` |
| `avatarField` | Field with an image URL, or a name to show as initials. Leave empty to use the initials of the title. | `{{components.recordlist1.avatarField}}` |
| `metaFields` | Comma-separated fields shown on the line under the title. Add a format after a pipe (`total\|currency`, `due\|date`) and a label after a colon, where `{}` marks the value (`due\|date:Due {}`). | `{{components.recordlist1.metaFields}}` |
| `statusField` | Field shown as a chip. Common words such as `Paid` or `Overdue` get a matching color. | `{{components.recordlist1.statusField}}` |
| `progressField` | Field with a percent from `0` to `100`, shown as a small progress bar. | `{{components.recordlist1.progressField}}` |
| `valueField` | Field shown on the right of each item, such as an amount. | `{{components.recordlist1.valueField}}` |
| `valueFormat` | How the value on the right is written, such as currency, a short number like `12K`, or a date. | `{{components.recordlist1.valueFormat}}` |
| `currency` | Currency code used when a value is formatted as currency, such as `USD` or `EUR`. | `{{components.recordlist1.currency}}` |
| `locale` | Locale used to format numbers, currency and dates, such as `en-US`. Leave empty to follow the currency. | `{{components.recordlist1.locale}}` |
| `statusColors` | A color for each status value, for example `{ "Paid": "#16a34a" }`. Overrides the automatic color. | `{{components.recordlist1.statusColors}}` |
| `idField` | Field that identifies each row. It fills **selectedItemId** when the user clicks an item. | `{{components.recordlist1.idField}}` |
| `showAvatar` | Shows the avatar at the start of each item. | `{{components.recordlist1.showAvatar}}` |
| `avatarShape` | Shape of the avatars. | `{{components.recordlist1.avatarShape}}` |
| `density` | Spacing of the items, from **compact** to **comfortable**. | `{{components.recordlist1.density}}` |
| `showDividers` | Draws a line between items. | `{{components.recordlist1.showDividers}}` |
| `listStyle` | **Card** draws the list in a bordered box; **Plain** shows the items without one. | `{{components.recordlist1.listStyle}}` |
| `highlightSelected` | Marks the clicked item as selected. Clicking it again clears the selection. | `{{components.recordlist1.highlightSelected}}` |
| `emptyText` | Message shown when there are no rows. | `{{components.recordlist1.emptyText}}` |
| `loadingIndicator` | What shows while the list is loading: a spinner or skeleton rows. | `{{components.recordlist1.loadingIndicator}}` |
| `selectedItemId` | The id of the selected item, from **Id field**. | `{{components.recordlist1.selectedItemId}}` |
| `selectedItem` | The data row of the selected item. | `{{components.recordlist1.selectedItem}}` |
| `selectedItemIndex` | The position of the selected item in the data, starting at `0`, or `-1` when none is selected. | `{{components.recordlist1.selectedItemIndex}}` |
| `isVisible` | Whether the component is visible. | `{{components.recordlist1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.recordlist1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.recordlist1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| List background | Theme: Surface 1 |
| Border and divider color | Theme: Default border |
| Title and value color | Theme: Primary text |
| Meta line color | Theme: Placeholder text |
| Selected row accent | Theme: Brand primary |
| List radius | — |
| Title typeface | Theme font |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
