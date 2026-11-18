---
id: gauge
title: Gauge
---

<div className="badge badge--primary">Ant Design</div>

The **Gauge** component shows one value on a dial against a scale, such as progress toward a target or a utilization score.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Target | The value the needle points to. The needle stops at the ends of the scale, but the number in the middle shows the real value. | Number. Default: `72` |
| Total | The value at the end of the scale. | Number. Default: `100` |
| Name | A name for the value the gauge shows. | Text |
| Thresholds | Where the color bands end, such as `[40, 70, 100]` for red, amber and green bands. Leave it empty for a single band in the theme color. | Array |
| Formatter | How the number in the middle is written. `percent` shows **Target** as a share of **Total**; `compact` shortens large numbers, such as `1.2K`. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `auto` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Title | Heading shown above the gauge. | Text |

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
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.gauge1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.gauge1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.gauge1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `target` | The value the needle points to. The needle stops at the ends of the scale, but the number in the middle shows the real value. | `{{components.gauge1.target}}` |
| `total` | The value at the end of the scale. | `{{components.gauge1.total}}` |
| `name` | A name for the value the gauge shows. | `{{components.gauge1.name}}` |
| `thresholds` | Where the color bands end, such as `[40, 70, 100]` for red, amber and green bands. Leave it empty for a single band in the theme color. | `{{components.gauge1.thresholds}}` |
| `formatter` | How the number in the middle is written. `percent` shows **Target** as a share of **Total**; `compact` shortens large numbers, such as `1.2K`. | `{{components.gauge1.formatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | `{{components.gauge1.currency}}` |
| `locale` | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.gauge1.locale}}` |
| `title` | Heading shown above the gauge. | `{{components.gauge1.title}}` |
| `isVisible` | Whether the component is visible. | `{{components.gauge1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.gauge1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.gauge1.isDisabled}}` |

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
