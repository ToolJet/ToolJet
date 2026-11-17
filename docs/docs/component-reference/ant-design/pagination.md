---
id: pagination
title: Pagination
---

<div className="badge badge--primary">Ant Design</div>

The **Pagination** component is Ant Design's page switcher. It lets users move through long lists or query results a page at a time, and its page and page size can drive a query.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Current | The page shown, counting from 1. A page past the last one shows the last page. | Number. Default: `1` |
| Page size | Number of items on each page. | Number. Default: `1` |
| Total | Number of items across all pages. With **Page size** it sets how many pages there are. | Number. Default: `50` |
| Show size changer | Shows a dropdown where the user picks how many items a page holds. | On or off. Default: Off |
| Simple | Shows a compact switcher with previous and next arrows and a page number box instead of a button for each page. | On or off. Default: Off |
| Size | Size of the page buttons. | `default`, `small`. Default: `default` |
| Show total | Text shown before the page buttons. `{start}`, `{end}` and `{total}` are replaced with the items shown and the total, as in `{start}-{end} of {total} items`. | Text |
| Align | Where the page buttons sit in the component's box. | `start`, `center`, `end`. Default: `end` |

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
| On change | Triggers when the page or the page size changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Go to page | Goes to the given **Page**. A page past the last one goes to the last page. | `components.pagination1.setCurrent("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.pagination1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.pagination1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.pagination1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `current` | The page shown, counting from 1. A page past the last one shows the last page. | `{{components.pagination1.current}}` |
| `pageSize` | Number of items on each page. | `{{components.pagination1.pageSize}}` |
| `total` | Number of items across all pages. With **Page size** it sets how many pages there are. | `{{components.pagination1.total}}` |
| `showSizeChanger` | Shows a dropdown where the user picks how many items a page holds. | `{{components.pagination1.showSizeChanger}}` |
| `simple` | Shows a compact switcher with previous and next arrows and a page number box instead of a button for each page. | `{{components.pagination1.simple}}` |
| `size` | Size of the page buttons. | `{{components.pagination1.size}}` |
| `showTotal` | Text shown before the page buttons. `{start}`, `{end}` and `{total}` are replaced with the items shown and the total, as in `{start}-{end} of {total} items`. | `{{components.pagination1.showTotal}}` |
| `align` | Where the page buttons sit in the component's box. | `{{components.pagination1.align}}` |
| `isVisible` | Whether the component is visible. | `{{components.pagination1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.pagination1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.pagination1.isDisabled}}` |

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
