---
id: spin
title: Spin
---

<div className="badge badge--primary">Ant Design</div>

The **Spin** component is Ant Design's loading spinner. It tells users that something is in progress, such as a query or a file upload.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Spinning | Shows the spinner. Turn it off to hide it, for example with `{{queries.getOrders.isLoading}}`. The spinner also appears while **Loading state** is on. | On or off. Default: On |
| Tip | Text shown under the spinner, such as `Loading orders`. | Text |
| Size | Size of the spinner. | `small`, `default`, `large`. Default: `default` |

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

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.spin1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.spin1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.spin1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `spinning` | Shows the spinner. Turn it off to hide it, for example with `{{queries.getOrders.isLoading}}`. The spinner also appears while **Loading state** is on. | `{{components.spin1.spinning}}` |
| `tip` | Text shown under the spinner, such as `Loading orders`. | `{{components.spin1.tip}}` |
| `size` | Size of the spinner. | `{{components.spin1.size}}` |
| `isVisible` | Whether the component is visible. | `{{components.spin1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.spin1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.spin1.isDisabled}}` |

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
