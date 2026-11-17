---
id: pie-chart
title: Pie Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Pie Chart** component shows how a total splits into parts, such as orders by channel or tickets by status. It can draw a full pie or a donut with a figure in the middle.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a slice. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked slice and its highlight. | `components.piechart1.clearClickedPoint()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Legend text color | Theme: Placeholder text |
| Slice border color | Theme: Surface 1 |
| Center figure color | Theme: Primary text |
| Center caption color | Theme: Placeholder text |
