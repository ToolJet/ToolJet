---
id: breadcrumb
title: Breadcrumb
---

<div className="badge badge--primary">Ant Design</div>

The **Breadcrumb** component shows where the current page sits in the app, such as Home / Orders / Order 1042, and lets users go back to an earlier level.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The levels to show, from top to current, as text such as `['Home', 'Orders']` or a list of `{title, key}`. Every item but the last is a link. | Array. Default: `["Home", "Orders", "Order 1042"]` |
| Separator | Character shown between items. | Text. Default: `/` |

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
| On click | Triggers when the user clicks an item. The last item is the current page and is not clickable. |

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
| `items` | The levels to show, from top to current, as text such as `['Home', 'Orders']` or a list of `{title, key}`. Every item but the last is a link. | `{{components.breadcrumb1.items}}` |
| `separator` | Character shown between items. | `{{components.breadcrumb1.separator}}` |
| `clickedKey` | Key of the item the user clicked last, or its title when it has no key. | `{{components.breadcrumb1.clickedKey}}` |
| `isVisible` | Whether the component is visible. | `{{components.breadcrumb1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.breadcrumb1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.breadcrumb1.isDisabled}}` |

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
