---
id: bar
title: Bar
---

<div className="badge badge--primary">Ant Design</div>

The **Bar** chart compares values across categories as horizontal bars, which suits long category names and ranked lists such as sales by region.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | The rows to plot, usually a query's data, one row per point on the x axis, such as `[{ month, sales }]`. | Array |
| X field | Name of the field in **Data** that holds the category for each bar, such as `region`. | Text. Default: `x` |
| Y field | Name of the field that holds the value, such as `sales`, or a list of fields such as `['sales', 'cost']` to plot each one as its own series. | Array. Default: `["y"]` |
| Color field | For data with one row per x value and series, the field that names the series, such as `region`. Each value gets its own color. | Text |
| Title | Heading shown above the chart. | Text |
| Legend | Where the legend sits, or `none` to hide it. The legend shows only when the chart has more than one series. | `top`, `bottom`, `right`, `none`. Default: `top` |
| Label | Shows each value on the chart. | On or off. Default: Off |
| Y formatter | How values on the axis, labels and tooltips are written. `compact` shortens large numbers, such as `1.2K`; `percent` reads `0.25` as `25%`; `auto` shows whole numbers with no decimals and others with up to two. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `compact` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Highlight clicked point | Keeps the clicked mark at full strength and fades the rest, until another mark is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Stack | Stacks the series end to end in one bar instead of placing them side by side. | On or off. Default: Off |
| Corner radius | Roundness of the bar ends, from 0 to 20 pixels. | Number. Default: `4` |

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
| On element click | Triggers when the user clicks a mark on the chart, such as a bar or point. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked mark, which empties `selectedDatum` and removes the highlight. | `components.bar1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.bar1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.bar1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.bar1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The rows to plot, usually a query's data, one row per point on the x axis, such as `[{ month, sales }]`. | `{{components.bar1.data}}` |
| `xField` | Name of the field in **Data** that holds the category for each bar, such as `region`. | `{{components.bar1.xField}}` |
| `yField` | Name of the field that holds the value, such as `sales`, or a list of fields such as `['sales', 'cost']` to plot each one as its own series. | `{{components.bar1.yField}}` |
| `colorField` | For data with one row per x value and series, the field that names the series, such as `region`. Each value gets its own color. | `{{components.bar1.colorField}}` |
| `title` | Heading shown above the chart. | `{{components.bar1.title}}` |
| `legend` | Where the legend sits, or `none` to hide it. The legend shows only when the chart has more than one series. | `{{components.bar1.legend}}` |
| `label` | Shows each value on the chart. | `{{components.bar1.label}}` |
| `yFormatter` | How values on the axis, labels and tooltips are written. `compact` shortens large numbers, such as `1.2K`; `percent` reads `0.25` as `25%`; `auto` shows whole numbers with no decimals and others with up to two. | `{{components.bar1.yFormatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | `{{components.bar1.currency}}` |
| `locale` | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.bar1.locale}}` |
| `highlightClicked` | Keeps the clicked mark at full strength and fades the rest, until another mark is clicked or **Clear clicked point** runs. | `{{components.bar1.highlightClicked}}` |
| `stack` | Stacks the series end to end in one bar instead of placing them side by side. | `{{components.bar1.stack}}` |
| `radius` | Roundness of the bar ends, from 0 to 20 pixels. | `{{components.bar1.radius}}` |
| `selectedDatum` | The data row of the mark the user clicked last. It is empty after **Clear clicked point**. | `{{components.bar1.selectedDatum}}` |
| `isVisible` | Whether the component is visible. | `{{components.bar1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.bar1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.bar1.isDisabled}}` |

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
