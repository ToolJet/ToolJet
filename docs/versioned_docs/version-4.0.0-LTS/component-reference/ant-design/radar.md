---
id: radar
title: Radar
---

<div className="badge badge--primary">Ant Design</div>

The **Radar** component is Ant Design's radar chart. It plots several measures on axes that radiate from a center, to compare profiles such as team skills or vendor scores.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to chart, one per axis, such as `[{ x: 'Speed', y: 80 }]`. | Array |
| X field | Field in each row that names the axis. | Text. Default: `x` |
| Y field | Field that holds the values, or a list of fields such as `['teamA', 'teamB']` to draw one shape per field. | Array. Default: `["y"]` |
| Color field | Field that names the series when the data has one row per axis and series. It draws one shape per series. | Text |
| Title | Heading shown above the chart. | Text |
| Legend | Where the legend sits, or `none` to hide it. The legend shows only when the chart has more than one series. | `top`, `bottom`, `right`, `none`. Default: `top` |
| Label | Shows each data point's value on the chart. | On or off. Default: Off |
| Y formatter | How values on the value axis, labels and tooltips are written. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `compact` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Highlight clicked point | Keeps the point the user clicked highlighted and fades the others until **Clear clicked point** runs. | On or off. Default: Off |
| Area | Fills the inside of each shape with a light color. | On or off. Default: On |

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
| On element click | Triggers when the user clicks a point or a shape on the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked point, which empties **selectedDatum** and removes the highlight. | `components.radar1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.radar1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.radar1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.radar1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to chart, one per axis, such as `[{ x: 'Speed', y: 80 }]`. | `{{components.radar1.data}}` |
| `xField` | Field in each row that names the axis. | `{{components.radar1.xField}}` |
| `yField` | Field that holds the values, or a list of fields such as `['teamA', 'teamB']` to draw one shape per field. | `{{components.radar1.yField}}` |
| `colorField` | Field that names the series when the data has one row per axis and series. It draws one shape per series. | `{{components.radar1.colorField}}` |
| `title` | Heading shown above the chart. | `{{components.radar1.title}}` |
| `legend` | Where the legend sits, or `none` to hide it. The legend shows only when the chart has more than one series. | `{{components.radar1.legend}}` |
| `label` | Shows each data point's value on the chart. | `{{components.radar1.label}}` |
| `yFormatter` | How values on the value axis, labels and tooltips are written. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `{{components.radar1.yFormatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | `{{components.radar1.currency}}` |
| `locale` | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.radar1.locale}}` |
| `highlightClicked` | Keeps the point the user clicked highlighted and fades the others until **Clear clicked point** runs. | `{{components.radar1.highlightClicked}}` |
| `area` | Fills the inside of each shape with a light color. | `{{components.radar1.area}}` |
| `selectedDatum` | The data row of the point the user clicked last, or `{}` after **Clear clicked point**. | `{{components.radar1.selectedDatum}}` |
| `isVisible` | Whether the component is visible. | `{{components.radar1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.radar1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.radar1.isDisabled}}` |

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
