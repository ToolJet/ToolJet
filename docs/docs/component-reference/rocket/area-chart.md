---
id: area-chart
title: Area Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Area Chart** component plots one or more series over a category or time axis, with the area under each line shaded. Use it to show trends such as revenue or sign-ups per month.

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
| Line only (no fill) | Draws each series as a line with no shaded area under it. | On or off. Default: Off |
| Stack series | Stacks the series on top of each other so the top edge shows their total. | On or off. Default: Off |
| Curve | Shape of the line between points: smooth (`monotone`, `natural`), straight (`linear`) or stepped (`step`). | `monotone`, `natural`, `linear`, `step`. Default: `monotone` |
| Highlight clicked point | Emphasizes the point the user clicks until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
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
| Clear clicked point | Clears the clicked point, and its highlight when **Highlight clicked point** is on. | `components.areachart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.areachart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.areachart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.areachart1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The rows to plot, as a list of objects, usually from a query. | `{{components.areachart1.data}}` |
| `xField` | The field in each row that gives the label along the x-axis, such as a month or category. | `{{components.areachart1.xField}}` |
| `yFields` | The field or fields to plot as series. Use one field name, a list, or a comma-separated list. | `{{components.areachart1.yFields}}` |
| `valuePrefix` | Text added before values on the axis and in tooltips, such as `$`. | `{{components.areachart1.valuePrefix}}` |
| `valueSuffix` | Text added after values on the axis and in tooltips, such as `%`. | `{{components.areachart1.valueSuffix}}` |
| `showLegend` | Shows a legend that names each series. It appears only when there is more than one series. | `{{components.areachart1.showLegend}}` |
| `seriesLabels` | Names to show for series instead of their field names, such as `{ "revenue": "Revenue" }`. | `{{components.areachart1.seriesLabels}}` |
| `emptyText` | Message shown when there is no data to plot. | `{{components.areachart1.emptyText}}` |
| `colors` | Colors for the series, in the same order as **Series fields**. | `{{components.areachart1.colors}}` |
| `lineOnly` | Draws each series as a line with no shaded area under it. | `{{components.areachart1.lineOnly}}` |
| `stack` | Stacks the series on top of each other so the top edge shows their total. | `{{components.areachart1.stack}}` |
| `curve` | Shape of the line between points: smooth (`monotone`, `natural`), straight (`linear`) or stepped (`step`). | `{{components.areachart1.curve}}` |
| `highlightClicked` | Emphasizes the point the user clicks until another is clicked or **Clear clicked point** runs. | `{{components.areachart1.highlightClicked}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | `{{components.areachart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the point the user last clicked. | `{{components.areachart1.clickedDataPoint}}` |
| `isVisible` | Whether the component is visible. | `{{components.areachart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.areachart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.areachart1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
