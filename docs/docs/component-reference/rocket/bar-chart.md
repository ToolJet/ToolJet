---
id: bar-chart
title: Bar Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Bar Chart** component compares values across categories with vertical or horizontal bars. Use it to show figures such as sales by region or tickets by status.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | The rows to plot, as a list of objects, usually from a query. | Array |
| X field | The field in each row that gives the label along the x-axis, such as a month or category. | Text. Default: `month` |
| Series fields (one or many) | The field or fields to plot as series. Use one field name, a list, or a comma-separated list. | Text. Default: `revenue` |
| Value prefix | Text added before values on the axis and in tooltips, such as `$`. | Text |
| Value suffix | Text added after values on the axis and in tooltips, such as `%`. | Text |
| Legend | Shows a legend that names each series. It appears only when there is more than one series. | On or off. Default: Off |
| Series labels (\{ field: label \}) | Names to show for series instead of their field names, such as `{ "revenue": "Revenue" }`. | Object |
| Empty message | Message shown when there is no data to plot. | Text. Default: `No data` |
| Series colors (in order) | Colors for the series, in the same order as **Series fields**. | Array |
| Horizontal bars | Draws the bars left to right instead of bottom to top. | On or off. Default: Off |
| Stack series | Stacks the series in one bar per category instead of side by side. | On or off. Default: Off |
| Highlight (category values, or first, last, max, min) | Bars to emphasize, by category value or as `first`, `last`, `max` or `min`. The other bars fade. | Text |
| Category colors (\{ category: color \}) | A color for each category, such as `{ "North": "#2563eb" }`. | Object |
| Highlight clicked point | Emphasizes the bar the user clicks until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | Spinner, Skeleton. Default: Spinner |

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
| Clear clicked point | Clears the clicked point, and its highlight when **Highlight clicked point** is on. | `components.barchart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.barchart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.barchart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.barchart1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The rows to plot, as a list of objects, usually from a query. | `{{components.barchart1.data}}` |
| `xField` | The field in each row that gives the label along the x-axis, such as a month or category. | `{{components.barchart1.xField}}` |
| `yFields` | The field or fields to plot as series. Use one field name, a list, or a comma-separated list. | `{{components.barchart1.yFields}}` |
| `valuePrefix` | Text added before values on the axis and in tooltips, such as `$`. | `{{components.barchart1.valuePrefix}}` |
| `valueSuffix` | Text added after values on the axis and in tooltips, such as `%`. | `{{components.barchart1.valueSuffix}}` |
| `showLegend` | Shows a legend that names each series. It appears only when there is more than one series. | `{{components.barchart1.showLegend}}` |
| `seriesLabels` | Names to show for series instead of their field names, such as `{ "revenue": "Revenue" }`. | `{{components.barchart1.seriesLabels}}` |
| `emptyText` | Message shown when there is no data to plot. | `{{components.barchart1.emptyText}}` |
| `colors` | Colors for the series, in the same order as **Series fields**. | `{{components.barchart1.colors}}` |
| `horizontal` | Draws the bars left to right instead of bottom to top. | `{{components.barchart1.horizontal}}` |
| `stack` | Stacks the series in one bar per category instead of side by side. | `{{components.barchart1.stack}}` |
| `highlight` | Bars to emphasize, by category value or as `first`, `last`, `max` or `min`. The other bars fade. | `{{components.barchart1.highlight}}` |
| `categoryColors` | A color for each category, such as `{ "North": "#2563eb" }`. | `{{components.barchart1.categoryColors}}` |
| `highlightClicked` | Emphasizes the bar the user clicks until another is clicked or **Clear clicked point** runs. | `{{components.barchart1.highlightClicked}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | `{{components.barchart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the point the user last clicked. | `{{components.barchart1.clickedDataPoint}}` |
| `isVisible` | Whether the component is visible. | `{{components.barchart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.barchart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.barchart1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
| Highlighted bar color (default: the series color) | Theme: Brand primary |
| Other bars color when highlighting (default: the series color, faded) | Theme: Brand primary |
| Bar radius | `4` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
