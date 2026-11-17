---
id: sparkline
title: Sparkline
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Sparkline** component is a tiny chart with no axes or grid that shows the shape of a trend at a glance, such as daily sales next to a KPI or a table cell.

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
| On click | Triggers when the user clicks the sparkline. |
| On double click | Triggers when the user double-clicks the sparkline. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.sparkline1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.sparkline1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.sparkline1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.sparkline1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.sparkline1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.sparkline1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Line color | Theme: Brand primary |
| Color when trend is up | Theme: Success |
| Color when trend is down | Theme: Error |
| Band color | Theme: Surface 3 |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
