---
id: pagination
title: Pagination
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Pagination** component shows page numbers with **Previous** and **Next** buttons, so the user can move through long lists of records one page at a time. Read the current page in a query to fetch the matching rows.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Number of pages | How many pages there are. Ignored when **Total records** is set. | Number. Default: `10` |
| Total records (instead of pages) | Total number of records to page through. When set, the number of pages is worked out from this and **Page size**. | Text |
| Page size (with total records) | Number of records on each page, used with **Total records**. | Number. Default: `10` |
| Default page index | Page shown when the app loads. When it changes later, the pager moves to that page and fires **On page change**. | Number. Default: `1` |
| Current page | The page that is selected. It updates as the user moves between pages. | Number. Default: `1` |
| Pages beside the current one | How many page numbers to show on each side of the current page before the rest collapse into an ellipsis. | Number. Default: `1` |
| First and last buttons | Shows buttons that jump to the first and last page. | On or off. Default: Off |
| Previous / Next labels | Shows the words **Previous** and **Next** next to the arrows. They are dropped when the pager is too narrow. | On or off. Default: On |
| Size | Size of the page buttons. | Sm, Default. Default: Default |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On page change | Triggers when the user moves to another page. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set page | Moves to the given **Page** and fires **On page change**. | `components.pagination1.setPage("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.pagination1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.pagination1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.pagination1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `numberOfPages` | How many pages there are. Ignored when **Total records** is set. | `{{components.pagination1.numberOfPages}}` |
| `totalRecords` | Total number of records to page through. When set, the number of pages is worked out from this and **Page size**. | `{{components.pagination1.totalRecords}}` |
| `pageSize` | Number of records on each page, used with **Total records**. | `{{components.pagination1.pageSize}}` |
| `defaultPageIndex` | Page shown when the app loads. When it changes later, the pager moves to that page and fires **On page change**. | `{{components.pagination1.defaultPageIndex}}` |
| `currentPageIndex` | The page that is selected. It updates as the user moves between pages. | `{{components.pagination1.currentPageIndex}}` |
| `siblingCount` | How many page numbers to show on each side of the current page before the rest collapse into an ellipsis. | `{{components.pagination1.siblingCount}}` |
| `showFirstLast` | Shows buttons that jump to the first and last page. | `{{components.pagination1.showFirstLast}}` |
| `showLabels` | Shows the words **Previous** and **Next** next to the arrows. They are dropped when the pager is too narrow. | `{{components.pagination1.showLabels}}` |
| `size` | Size of the page buttons. | `{{components.pagination1.size}}` |
| `totalPages` | The number of pages, including the one worked out from **Total records**. | `{{components.pagination1.totalPages}}` |
| `isVisible` | Whether the component is visible. | `{{components.pagination1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.pagination1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.pagination1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Page text color | Theme: Primary text |
| Hover background | Theme: Surface 3 |
| Current page background | Theme: Brand primary |
| Current page text color | Theme: Brand primary |
| Current page border color | Theme: Brand primary |
| Button radius | — |
| Alignment | `left` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
