---
id: radial-chart
title: Radial Chart
---

<div className="badge badge--primary">Ant Design</div>

The **Radial Chart** component shows figures as rings. It shows one value against a maximum as a progress ring, such as a quota reached, or compares a few categories as concentric rings.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Mode | `progress` shows one ring for **Value** out of **Max value**; `categories` shows one ring per row of **Data**. | `progress`, `categories`. Default: `progress` |
| Value | The figure shown on the progress ring. | Number. Default: `68` |
| Max value | The figure that fills the ring completely. | Number. Default: `100` |
| Data | Rows to show as rings in `categories` mode, such as `[{ name: 'Charter', value: 62 }]`. | Array |
| Category field | Field in each row that names the ring. | Text. Default: `name` |
| Value field | Field in each row that holds the ring's value. | Text. Default: `value` |
| Center value | Text shown in the middle of the progress ring. Leave it empty to show the percent. | Text |
| Center label | Smaller text shown under the center value of the progress ring. | Text |
| Type | Shape of the progress ring. `circle` is a full ring; `dashboard` leaves a gap at the bottom. | `circle`, `dashboard`. Default: `dashboard` |
| Stroke width | Thickness of the progress ring. | Number. Default: `8` |
| Show legend | Shows a legend of the categories in `categories` mode. | On or off. Default: On |
| Colors | Colors to use, such as `['#4f46e5', '#22c55e']`. The progress ring uses the first. Leave it empty to use the theme's colors. | Array |

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
| On click | Triggers when the user clicks the progress ring or one of the category rings. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears **clickedDataPoint**. | `components.radialchart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.radialchart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.radialchart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.radialchart1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `mode` | `progress` shows one ring for **Value** out of **Max value**; `categories` shows one ring per row of **Data**. | `{{components.radialchart1.mode}}` |
| `value` | The figure shown on the progress ring. | `{{components.radialchart1.value}}` |
| `maxValue` | The figure that fills the ring completely. | `{{components.radialchart1.maxValue}}` |
| `data` | Rows to show as rings in `categories` mode, such as `[{ name: 'Charter', value: 62 }]`. | `{{components.radialchart1.data}}` |
| `categoryField` | Field in each row that names the ring. | `{{components.radialchart1.categoryField}}` |
| `valueField` | Field in each row that holds the ring's value. | `{{components.radialchart1.valueField}}` |
| `centerValue` | Text shown in the middle of the progress ring. Leave it empty to show the percent. | `{{components.radialchart1.centerValue}}` |
| `centerLabel` | Smaller text shown under the center value of the progress ring. | `{{components.radialchart1.centerLabel}}` |
| `type` | Shape of the progress ring. `circle` is a full ring; `dashboard` leaves a gap at the bottom. | `{{components.radialchart1.type}}` |
| `strokeWidth` | Thickness of the progress ring. | `{{components.radialchart1.strokeWidth}}` |
| `showLegend` | Shows a legend of the categories in `categories` mode. | `{{components.radialchart1.showLegend}}` |
| `colors` | Colors to use, such as `['#4f46e5', '#22c55e']`. The progress ring uses the first. Leave it empty to use the theme's colors. | `{{components.radialchart1.colors}}` |
| `clickedDataPoint` | What the user clicked last: `{ value, maxValue, percent }` for the progress ring, or the `{ name, value }` of a category ring. `{}` after **Clear clicked point**. | `{{components.radialchart1.clickedDataPoint}}` |
| `isVisible` | Whether the component is visible. | `{{components.radialchart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.radialchart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.radialchart1.isDisabled}}` |

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
