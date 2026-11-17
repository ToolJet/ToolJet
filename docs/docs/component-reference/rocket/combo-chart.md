---
id: combo-chart
title: Combo Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Combo Chart** component draws bars and lines on one chart, with an optional second axis on the right. Use it to compare two kinds of numbers over time, such as revenue as bars and margin percentage as a line.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | The rows to plot, as a list of objects such as `{ month, revenue, margin }`. | Array |
| X field | The field in each row used for the horizontal axis, such as `month`. | Text. Default: `month` |
| Bar series (fields) | Fields drawn as bars, separated by commas. | Text. Default: `revenue` |
| Line series (fields) | Fields drawn as lines, separated by commas. A field already listed in **Bar series (fields)** is drawn as a bar only. | Text. Default: `margin` |
| Right axis series (fields) | Fields measured on a second axis on the right, separated by commas. Use it for values on a different scale, such as percentages. | Text. Default: `margin` |
| Stack bars | Stacks the bars of each row on top of each other instead of side by side. | On or off. Default: Off |
| Line curve | Shape of the lines between points: `monotone` is smooth, `linear` uses straight segments and `step` uses steps. | `monotone`, `linear`, `step`. Default: `monotone` |
| Line dots | Shows a dot at each point on the lines. | On or off. Default: On |
| Line width (px) | Thickness of the lines, in pixels. | Number. Default: `2` |
| Value format | How values on the left axis and in tooltips are shown: as plain numbers, currency, percentages or short forms like `4.5K`. | `number`, `currency`, `percent`, `compact`. Default: `number` |
| Right axis format | How values on the right axis are shown: as plain numbers, currency, percentages or short forms. | `number`, `currency`, `percent`, `compact`. Default: `percent` |
| Currency code | The currency code used when a format is `currency`, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | The locale used to format numbers and currency, such as `pt-BR`. Leave empty to follow the currency. | Text |
| Value prefix | Text shown before values on the left axis and in tooltips. | Text |
| Value suffix | Text shown after values on the left axis and in tooltips. | Text |
| Empty message | Message shown when there is no data to plot. | Text. Default: `No data` |
| Animate | Animates the bars and lines when the chart draws. | On or off. Default: On |
| Grid | Shows horizontal grid lines. | On or off. Default: On |
| Legend | Shows a legend with the name and color of each series. | On or off. Default: On |
| Series labels (\{ field: label \}) | Names to show for each field in the legend and tooltips, such as `{ revenue: "Revenue" }`. | Object. Default: `{"revenue": "Revenue", "margin": "Margin"}` |
| Series colors (in order) | Colors for the series, in the order they are drawn: bars first, then lines. | Array |
| Highlight clicked point | Emphasizes the clicked bar or point until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What the chart shows while it is loading: a **Spinner** or a **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks a bar or point on the chart. |
| On double click | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked data point and removes its highlight. | `components.combochart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.combochart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.combochart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.combochart1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The rows to plot, as a list of objects such as `{ month, revenue, margin }`. | `{{components.combochart1.data}}` |
| `xField` | The field in each row used for the horizontal axis, such as `month`. | `{{components.combochart1.xField}}` |
| `barFields` | Fields drawn as bars, separated by commas. | `{{components.combochart1.barFields}}` |
| `lineFields` | Fields drawn as lines, separated by commas. A field already listed in **Bar series (fields)** is drawn as a bar only. | `{{components.combochart1.lineFields}}` |
| `rightAxisFields` | Fields measured on a second axis on the right, separated by commas. Use it for values on a different scale, such as percentages. | `{{components.combochart1.rightAxisFields}}` |
| `stackBars` | Stacks the bars of each row on top of each other instead of side by side. | `{{components.combochart1.stackBars}}` |
| `curve` | Shape of the lines between points: `monotone` is smooth, `linear` uses straight segments and `step` uses steps. | `{{components.combochart1.curve}}` |
| `showDots` | Shows a dot at each point on the lines. | `{{components.combochart1.showDots}}` |
| `strokeWidth` | Thickness of the lines, in pixels. | `{{components.combochart1.strokeWidth}}` |
| `yAxisFormat` | How values on the left axis and in tooltips are shown: as plain numbers, currency, percentages or short forms like `4.5K`. | `{{components.combochart1.yAxisFormat}}` |
| `rightAxisFormat` | How values on the right axis are shown: as plain numbers, currency, percentages or short forms. | `{{components.combochart1.rightAxisFormat}}` |
| `currency` | The currency code used when a format is `currency`, such as `USD` or `EUR`. | `{{components.combochart1.currency}}` |
| `locale` | The locale used to format numbers and currency, such as `pt-BR`. Leave empty to follow the currency. | `{{components.combochart1.locale}}` |
| `valuePrefix` | Text shown before values on the left axis and in tooltips. | `{{components.combochart1.valuePrefix}}` |
| `valueSuffix` | Text shown after values on the left axis and in tooltips. | `{{components.combochart1.valueSuffix}}` |
| `emptyText` | Message shown when there is no data to plot. | `{{components.combochart1.emptyText}}` |
| `animate` | Animates the bars and lines when the chart draws. | `{{components.combochart1.animate}}` |
| `showGrid` | Shows horizontal grid lines. | `{{components.combochart1.showGrid}}` |
| `showLegend` | Shows a legend with the name and color of each series. | `{{components.combochart1.showLegend}}` |
| `seriesLabels` | Names to show for each field in the legend and tooltips, such as `{ revenue: "Revenue" }`. | `{{components.combochart1.seriesLabels}}` |
| `colors` | Colors for the series, in the order they are drawn: bars first, then lines. | `{{components.combochart1.colors}}` |
| `highlightClicked` | Emphasizes the clicked bar or point until another is clicked or **Clear clicked point** runs. | `{{components.combochart1.highlightClicked}}` |
| `loadingIndicator` | What the chart shows while it is loading: a **Spinner** or a **Skeleton** placeholder. | `{{components.combochart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row the user last clicked. | `{{components.combochart1.clickedDataPoint}}` |
| `isVisible` | Whether the component is visible. | `{{components.combochart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.combochart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.combochart1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
