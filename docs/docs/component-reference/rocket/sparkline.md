---
id: sparkline
title: Sparkline
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Sparkline** component is a tiny chart with no axes or grid that shows the shape of a trend at a glance, such as daily sales next to a KPI or a table cell.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Values to draw, as a list of numbers or as `{ x, y }` objects. | Array. Default: `[12, 18, 15, 22, 19, 26, 24, 31]` |
| Type | Draw the values as a line, a filled area or bars. | `line`, `area`, `bar`. Default: `area` |
| Curve | How points are joined: a smooth curve (**monotone**), straight lines (**linear**) or steps (**step**). | `monotone`, `linear`, `step`. Default: `monotone` |
| Line width (px) | Thickness of the line in pixels. | Number. Default: `2` |
| End dot | Marks the last value with a dot. | On or off. Default: On |
| Color by trend | Colors the chart green when the last value is better than the first, and red when it is worse. | On or off. Default: Off |
| Lower is better | Treats a fall as good, for measures such as costs or response times. Affects **Color by trend** and the **trend** value. | On or off. Default: Off |
| Min/max band | Shades a horizontal band behind the chart, from **Band from** to **Band to**, such as a normal or target range. | On or off. Default: Off |
| Band from (blank = data min) | Bottom of the band. Leave empty to start at the lowest value. | Text |
| Band to (blank = data max) | Top of the band. Leave empty to end at the highest value. | Text |
| Tooltip | Shows the value under the pointer in a tooltip. | On or off. Default: Off |
| Value prefix | Text shown before values in the tooltip, such as `$`. | Text |
| Value suffix | Text shown after values in the tooltip, such as `%`. | Text |
| Empty message | Message shown when there is no data to draw. | Text. Default: `No data` |
| Animate | Animates the chart when it first draws or its data changes. | On or off. Default: On |
| Loading look | What shows while the chart is loading: a spinner or a skeleton block. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the sparkline. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the sparkline. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Values to draw, as a list of numbers or as `{ x, y }` objects. | `{{components.sparkline1.data}}` |
| `type` | Draw the values as a line, a filled area or bars. | `{{components.sparkline1.type}}` |
| `curve` | How points are joined: a smooth curve (**monotone**), straight lines (**linear**) or steps (**step**). | `{{components.sparkline1.curve}}` |
| `strokeWidth` | Thickness of the line in pixels. | `{{components.sparkline1.strokeWidth}}` |
| `showEndDot` | Marks the last value with a dot. | `{{components.sparkline1.showEndDot}}` |
| `colorByTrend` | Colors the chart green when the last value is better than the first, and red when it is worse. | `{{components.sparkline1.colorByTrend}}` |
| `lowerIsBetter` | Treats a fall as good, for measures such as costs or response times. Affects **Color by trend** and the **trend** value. | `{{components.sparkline1.lowerIsBetter}}` |
| `showBand` | Shades a horizontal band behind the chart, from **Band from** to **Band to**, such as a normal or target range. | `{{components.sparkline1.showBand}}` |
| `bandMin` | Bottom of the band. Leave empty to start at the lowest value. | `{{components.sparkline1.bandMin}}` |
| `bandMax` | Top of the band. Leave empty to end at the highest value. | `{{components.sparkline1.bandMax}}` |
| `showTooltip` | Shows the value under the pointer in a tooltip. | `{{components.sparkline1.showTooltip}}` |
| `valuePrefix` | Text shown before values in the tooltip, such as `$`. | `{{components.sparkline1.valuePrefix}}` |
| `valueSuffix` | Text shown after values in the tooltip, such as `%`. | `{{components.sparkline1.valueSuffix}}` |
| `emptyText` | Message shown when there is no data to draw. | `{{components.sparkline1.emptyText}}` |
| `animate` | Animates the chart when it first draws or its data changes. | `{{components.sparkline1.animate}}` |
| `loadingIndicator` | What shows while the chart is loading: a spinner or a skeleton block. | `{{components.sparkline1.loadingIndicator}}` |
| `trend` | The direction from the first value to the last: `up`, `down` or `flat`. With **Lower is better** on, a fall reads as `up`. | `{{components.sparkline1.trend}}` |
| `lastValue` | The last value in the data. | `{{components.sparkline1.lastValue}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Line color | Theme: Brand primary |
| Color when trend is up | `var(--cc-success-systemStatus)` |
| Color when trend is down | `var(--cc-error-systemStatus)` |
| Band color | Theme: Surface 3 |
