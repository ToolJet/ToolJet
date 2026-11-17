---
id: line-chart
title: Line Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Line Chart** component plots one or more series as lines, which suits trends over time such as revenue by month or daily sign-ups.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | The rows to plot, for example `{{queries.getSales.data}}`. | Array |
| X field | The field shown along the horizontal axis, such as a month or date. | Text. Default: `month` |
| Series fields (one or many) | The field or fields to draw as lines, one line each. Separate several fields with commas or give a list. | Text. Default: `revenue, expenses` |
| Curve | How points are joined. `monotone` draws smooth curves, `linear` straight segments and `step` right-angled steps. | `monotone`, `linear`, `step`. Default: `monotone` |
| Dots | Draws a dot at every data point. | On or off. Default: Off |
| Line width (px) | Thickness of the lines in pixels. | Number. Default: `2` |
| Dashed series (fields) | Series fields to draw as dashed lines, separated by commas, for example to show a forecast. | Text |
| Target line value | Draws a dashed horizontal line at this value, such as a target or limit. Leave empty for no line. | Text |
| Target line label | Text shown beside the target line. | Text |
| Value format | How values are shown on the axis and in tooltips: as a `number`, `currency`, `percent` or `compact` number such as `12K`. | `number`, `currency`, `percent`, `compact`. Default: `number` |
| Currency code | Currency code used when **Value format** is `currency`, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Locale used to format numbers, such as `en-US` or `de-DE`. Leave empty to use the browser's locale. | Text |
| Value prefix | Text added before every value, such as `~`. | Text |
| Value suffix | Text added after every value, such as ` units`. | Text |
| Empty message | Text shown when there is no data to plot. | Text. Default: `No data` |
| Animate | Animates the lines when the chart first draws or the data changes. | On or off. Default: On |
| Grid | Shows horizontal grid lines behind the chart. | On or off. Default: On |
| Legend | Shows a legend naming each series. It appears only when there is more than one series. | On or off. Default: On |
| Series labels (\{ field: label \}) | Display names for series, for example `{ revenue: "Revenue" }`. Unlisted series show their field name. | Object |
| Series colors (in order) | Colors for the series, in the same order as **Series fields**. | Array |
| Highlight clicked point | Keeps the clicked point emphasized until another point is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** block. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a point on the chart. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked point and removes its highlight. | `components.linechart1.clearClickedPoint()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The rows to plot, for example `{{queries.getSales.data}}`. | `{{components.linechart1.data}}` |
| `xField` | The field shown along the horizontal axis, such as a month or date. | `{{components.linechart1.xField}}` |
| `yFields` | The field or fields to draw as lines, one line each. Separate several fields with commas or give a list. | `{{components.linechart1.yFields}}` |
| `curve` | How points are joined. `monotone` draws smooth curves, `linear` straight segments and `step` right-angled steps. | `{{components.linechart1.curve}}` |
| `showDots` | Draws a dot at every data point. | `{{components.linechart1.showDots}}` |
| `strokeWidth` | Thickness of the lines in pixels. | `{{components.linechart1.strokeWidth}}` |
| `dashedFields` | Series fields to draw as dashed lines, separated by commas, for example to show a forecast. | `{{components.linechart1.dashedFields}}` |
| `referenceValue` | Draws a dashed horizontal line at this value, such as a target or limit. Leave empty for no line. | `{{components.linechart1.referenceValue}}` |
| `referenceLabel` | Text shown beside the target line. | `{{components.linechart1.referenceLabel}}` |
| `yAxisFormat` | How values are shown on the axis and in tooltips: as a `number`, `currency`, `percent` or `compact` number such as `12K`. | `{{components.linechart1.yAxisFormat}}` |
| `currency` | Currency code used when **Value format** is `currency`, such as `USD` or `EUR`. | `{{components.linechart1.currency}}` |
| `locale` | Locale used to format numbers, such as `en-US` or `de-DE`. Leave empty to use the browser's locale. | `{{components.linechart1.locale}}` |
| `valuePrefix` | Text added before every value, such as `~`. | `{{components.linechart1.valuePrefix}}` |
| `valueSuffix` | Text added after every value, such as ` units`. | `{{components.linechart1.valueSuffix}}` |
| `emptyText` | Text shown when there is no data to plot. | `{{components.linechart1.emptyText}}` |
| `animate` | Animates the lines when the chart first draws or the data changes. | `{{components.linechart1.animate}}` |
| `showGrid` | Shows horizontal grid lines behind the chart. | `{{components.linechart1.showGrid}}` |
| `showLegend` | Shows a legend naming each series. It appears only when there is more than one series. | `{{components.linechart1.showLegend}}` |
| `seriesLabels` | Display names for series, for example `{ revenue: "Revenue" }`. Unlisted series show their field name. | `{{components.linechart1.seriesLabels}}` |
| `colors` | Colors for the series, in the same order as **Series fields**. | `{{components.linechart1.colors}}` |
| `highlightClicked` | Keeps the clicked point emphasized until another point is clicked or **Clear clicked point** runs. | `{{components.linechart1.highlightClicked}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** block. | `{{components.linechart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the point the user clicked last. | `{{components.linechart1.clickedDataPoint}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
| Target line color | Theme: Placeholder text |
