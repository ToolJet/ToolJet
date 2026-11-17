---
id: combo-chart
title: Combo Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Combo Chart** component draws bars and lines on one chart, with an optional second axis on the right. Use it to compare two kinds of numbers over time, such as revenue as bars and margin percentage as a line.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a bar or point on the chart. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked data point and removes its highlight. | `components.combochart1.clearClickedPoint()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
