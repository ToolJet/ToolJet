---
id: breadcrumb
title: Breadcrumb
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Breadcrumb** component shows the path to the current page, such as Home > Orders > Order 1042, so users can see where they are and go back up a level.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The steps of the path, as text or `{ title, value }` objects. The last item is the current page and can't be clicked. Long paths show the first item and the last few with `…` between. | Array. Default: `["Home", "Section", "Page"]` |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | Spinner, Skeleton. Default: Spinner |

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
| On item clicked | Triggers when the user clicks an item in the path. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.breadcrumb1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.breadcrumb1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.breadcrumb1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The steps of the path, as text or `{ title, value }` objects. The last item is the current page and can't be clicked. Long paths show the first item and the last few with `…` between. | `{{components.breadcrumb1.items}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | `{{components.breadcrumb1.loadingIndicator}}` |
| `lastClickedItem` | The item the user last clicked, with its `title`, `value` and `index` in **Items**. | `{{components.breadcrumb1.lastClickedItem}}` |
| `isVisible` | Whether the component is visible. | `{{components.breadcrumb1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.breadcrumb1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.breadcrumb1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Breadcrumb link color | Theme: Placeholder text |
| Current page color | Theme: Primary text |
| Separator color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
