---
id: spinner
title: Spinner
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Spinner** component shows an animated indicator, with an optional label, to tell the user that something is loading or a task is running.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Variant | Style of the animation: a spinning **Ring**, pulsing **Dots** or moving **Bars**. | Ring, Dots, Bars. Default: Ring |
| Size (sm, default, lg or px) | Size of the indicator: `sm`, `default`, `lg`, or a number of pixels from `8` to `200`. | Text. Default: `default` |
| Label | Text shown with the indicator. Leave empty to show the indicator alone. | Text. Default: `Loading…` |
| Label position | Whether the label sits **Beside** the indicator or **Below** it. | Beside, Below. Default: Beside |

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
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.spinner1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.spinner1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.spinner1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `variant` | Style of the animation: a spinning **Ring**, pulsing **Dots** or moving **Bars**. | `{{components.spinner1.variant}}` |
| `size` | Size of the indicator: `sm`, `default`, `lg`, or a number of pixels from `8` to `200`. | `{{components.spinner1.size}}` |
| `label` | Text shown with the indicator. Leave empty to show the indicator alone. | `{{components.spinner1.label}}` |
| `labelPosition` | Whether the label sits **Beside** the indicator or **Below** it. | `{{components.spinner1.labelPosition}}` |
| `isVisible` | Whether the component is visible. | `{{components.spinner1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.spinner1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.spinner1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Spinner color | Theme: Brand primary |
| Ring track color | Theme: Brand primary |
| Label color | Theme: Placeholder text |
| Alignment | `left` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
