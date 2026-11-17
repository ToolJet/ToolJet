---
id: scatter-chart
title: Scatter Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Scatter Chart** component plots each row as a point by two numbers, to show how they relate, such as marketing spend against revenue per account. With a size field it becomes a bubble chart.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to plot, one point per row. Rows without both numbers are left out. | Array |
| X field | Field that sets each point's position across. | Text. Default: `spend` |
| Y field | Field that sets each point's position up and down. | Text. Default: `revenue` |
| Size field (bubbles) | Field that sets the size of each point, turning the chart into a bubble chart. Leave empty for points of equal size. | Text. Default: `seats` |
| Group field (one colour each) | Field that splits the points into groups, each with its own color and legend entry. | Text. Default: `segment` |
| Name field (tooltip title) | Field shown as the title of a point's tooltip. | Text. Default: `account` |
| X axis title | Title shown under the horizontal axis. | Text. Default: `Marketing spend ($k)` |
| Y axis title | Title shown beside the vertical axis. | Text. Default: `Revenue ($k)` |
| X format | How numbers on the horizontal axis are written. | `number`, `currency`, `percent`, `compact`. Default: `number` |
| Y format | How numbers on the vertical axis are written. | `number`, `currency`, `percent`, `compact`. Default: `number` |
| Currency code | Currency code used when an axis format is **currency**, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Locale used to format numbers and currency, such as `en-US`. Leave empty to follow the currency. | Text |
| Vertical line at x | Draws a dashed vertical line at this x value, such as a target or an average. | Text |
| Horizontal line at y | Draws a dashed horizontal line at this y value, such as a target or an average. | Text |
| Point size (px) | Size of the points in pixels. With **Size field** set, it scales the range of bubble sizes. | Number. Default: `6` |
| Fill opacity (0 to 1) | How solid the points are, from `0` to `1`. Leave empty for `0.6` on bubbles and `0.85` on points. | Text |
| Value prefix | Text shown before y values, such as `$`. | Text |
| Value suffix | Text shown after y values, such as `%`. | Text |
| Empty message | Message shown when there is no data to plot. | Text. Default: `No data` |
| Animate | Animates the points when the chart first draws or its data changes. | On or off. Default: On |
| Grid | Shows background grid lines. | On or off. Default: On |
| Legend | Shows a legend that names each group and its color. | On or off. Default: On |
| Series colors (in order) | Colors for the groups, used in order. Leave empty to use the theme's chart colors. | Array |
| Highlight clicked point | Keeps the clicked point highlighted and dims the others until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What shows while the chart is loading: a spinner or a skeleton block. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a point. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked point and its highlight. | `components.scatterchart1.clearClickedPoint()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to plot, one point per row. Rows without both numbers are left out. | `{{components.scatterchart1.data}}` |
| `xField` | Field that sets each point's position across. | `{{components.scatterchart1.xField}}` |
| `yField` | Field that sets each point's position up and down. | `{{components.scatterchart1.yField}}` |
| `sizeField` | Field that sets the size of each point, turning the chart into a bubble chart. Leave empty for points of equal size. | `{{components.scatterchart1.sizeField}}` |
| `groupField` | Field that splits the points into groups, each with its own color and legend entry. | `{{components.scatterchart1.groupField}}` |
| `nameField` | Field shown as the title of a point's tooltip. | `{{components.scatterchart1.nameField}}` |
| `xLabel` | Title shown under the horizontal axis. | `{{components.scatterchart1.xLabel}}` |
| `yLabel` | Title shown beside the vertical axis. | `{{components.scatterchart1.yLabel}}` |
| `xAxisFormat` | How numbers on the horizontal axis are written. | `{{components.scatterchart1.xAxisFormat}}` |
| `yAxisFormat` | How numbers on the vertical axis are written. | `{{components.scatterchart1.yAxisFormat}}` |
| `currency` | Currency code used when an axis format is **currency**, such as `USD` or `EUR`. | `{{components.scatterchart1.currency}}` |
| `locale` | Locale used to format numbers and currency, such as `en-US`. Leave empty to follow the currency. | `{{components.scatterchart1.locale}}` |
| `referenceX` | Draws a dashed vertical line at this x value, such as a target or an average. | `{{components.scatterchart1.referenceX}}` |
| `referenceY` | Draws a dashed horizontal line at this y value, such as a target or an average. | `{{components.scatterchart1.referenceY}}` |
| `pointSize` | Size of the points in pixels. With **Size field** set, it scales the range of bubble sizes. | `{{components.scatterchart1.pointSize}}` |
| `fillOpacity` | How solid the points are, from `0` to `1`. Leave empty for `0.6` on bubbles and `0.85` on points. | `{{components.scatterchart1.fillOpacity}}` |
| `valuePrefix` | Text shown before y values, such as `$`. | `{{components.scatterchart1.valuePrefix}}` |
| `valueSuffix` | Text shown after y values, such as `%`. | `{{components.scatterchart1.valueSuffix}}` |
| `emptyText` | Message shown when there is no data to plot. | `{{components.scatterchart1.emptyText}}` |
| `animate` | Animates the points when the chart first draws or its data changes. | `{{components.scatterchart1.animate}}` |
| `showGrid` | Shows background grid lines. | `{{components.scatterchart1.showGrid}}` |
| `showLegend` | Shows a legend that names each group and its color. | `{{components.scatterchart1.showLegend}}` |
| `colors` | Colors for the groups, used in order. Leave empty to use the theme's chart colors. | `{{components.scatterchart1.colors}}` |
| `highlightClicked` | Keeps the clicked point highlighted and dims the others until another is clicked or **Clear clicked point** runs. | `{{components.scatterchart1.highlightClicked}}` |
| `loadingIndicator` | What shows while the chart is loading: a spinner or a skeleton block. | `{{components.scatterchart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the point the user clicked last. | `{{components.scatterchart1.clickedDataPoint}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
| Reference line color | Theme: Placeholder text |
