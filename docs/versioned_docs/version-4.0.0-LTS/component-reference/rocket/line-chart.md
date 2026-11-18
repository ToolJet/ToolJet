---
id: line-chart
title: Line Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Line Chart** component plots one or more series as lines, which suits trends over time such as revenue by month or daily sign-ups.

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
| On click | Triggers when the user clicks a point on the chart. |
| On double click | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked point and removes its highlight. | `components.linechart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.linechart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.linechart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.linechart1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.linechart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.linechart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.linechart1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
| Target line color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
