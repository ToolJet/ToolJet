---
id: pie-chart
title: Pie Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Pie Chart** component shows how a total splits into parts, such as orders by channel or tickets by status. It can draw a full pie or a donut with a figure in the middle.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to chart, one slice per row. Rows with a negative value are left out. | Array |
| Category field | Field in each row that names the slice. | Text. Default: `type` |
| Value field | Field in each row that sets the size of the slice. | Text. Default: `value` |
| Donut | Draws the chart as a ring with a hole in the middle instead of a full pie. | On or off. Default: On |
| Center figure | Large figure shown in the hole of the donut, such as a total. | Text |
| Center caption | Caption shown under **Center figure** in the hole of the donut. | Text |
| Legend | Shows a legend that names each slice and its color. | On or off. Default: On |
| Empty message | Message shown when there is no data to chart. | Text. Default: `No data` |
| Series colors (in order) | Colors for the slices, used in order. Leave empty to use the theme's chart colors, or matching status colors when every category is a status such as `Completed` or `Missed`. | Array |
| Value prefix | Text shown before values in the tooltip, such as `$`. | Text |
| Value suffix | Text shown after values in the tooltip, such as `%`. | Text |
| Highlight clicked point | Keeps the clicked slice highlighted and dims the others until another slice is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What shows while the chart is loading: a spinner or a skeleton block. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks a slice. |
| On double click | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked slice and its highlight. | `components.piechart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.piechart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.piechart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.piechart1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to chart, one slice per row. Rows with a negative value are left out. | `{{components.piechart1.data}}` |
| `categoryField` | Field in each row that names the slice. | `{{components.piechart1.categoryField}}` |
| `valueField` | Field in each row that sets the size of the slice. | `{{components.piechart1.valueField}}` |
| `donut` | Draws the chart as a ring with a hole in the middle instead of a full pie. | `{{components.piechart1.donut}}` |
| `centerValue` | Large figure shown in the hole of the donut, such as a total. | `{{components.piechart1.centerValue}}` |
| `centerLabel` | Caption shown under **Center figure** in the hole of the donut. | `{{components.piechart1.centerLabel}}` |
| `showLegend` | Shows a legend that names each slice and its color. | `{{components.piechart1.showLegend}}` |
| `emptyText` | Message shown when there is no data to chart. | `{{components.piechart1.emptyText}}` |
| `colors` | Colors for the slices, used in order. Leave empty to use the theme's chart colors, or matching status colors when every category is a status such as `Completed` or `Missed`. | `{{components.piechart1.colors}}` |
| `valuePrefix` | Text shown before values in the tooltip, such as `$`. | `{{components.piechart1.valuePrefix}}` |
| `valueSuffix` | Text shown after values in the tooltip, such as `%`. | `{{components.piechart1.valueSuffix}}` |
| `highlightClicked` | Keeps the clicked slice highlighted and dims the others until another slice is clicked or **Clear clicked point** runs. | `{{components.piechart1.highlightClicked}}` |
| `loadingIndicator` | What shows while the chart is loading: a spinner or a skeleton block. | `{{components.piechart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the slice the user clicked last. | `{{components.piechart1.clickedDataPoint}}` |
| `isVisible` | Whether the component is visible. | `{{components.piechart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.piechart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.piechart1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Legend text color | Theme: Placeholder text |
| Slice border color | Theme: Surface 1 |
| Center figure color | Theme: Primary text |
| Center caption color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
