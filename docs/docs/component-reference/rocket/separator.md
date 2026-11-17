---
id: separator
title: Separator
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Separator** component draws a thin line to divide sections of a page or form, optionally with a short label in the middle such as `or`.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Orientation | Whether the line runs across or up and down. | `horizontal`, `vertical`. Default: `horizontal` |
| Label | Text shown in the middle of a horizontal line. Not shown on a vertical line. | Text |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.separator1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.separator1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.separator1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `orientation` | Whether the line runs across or up and down. | `{{components.separator1.orientation}}` |
| `label` | Text shown in the middle of a horizontal line. Not shown on a vertical line. | `{{components.separator1.label}}` |
| `isVisible` | Whether the component is visible. | `{{components.separator1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.separator1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.separator1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Line | Theme: Default border |
| Thickness | `1` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
