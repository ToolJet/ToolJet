---
id: sparkline
title: Sparkline
---

<div className="badge badge--primary">Ant Design</div>

The **Sparkline** component is a small chart with no axes that shows the shape of a trend at a glance, such as daily sign-ups next to a key figure.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Values to plot in order, as numbers such as `[12, 18, 15, 22]` or as rows such as `[{ value: 12 }]`. | Array. Default: `[12, 18, 15, 22, 19, 26, 24, 31]` |
| Value field | Field that holds the number when **Data** is a list of rows. | Text. Default: `value` |
| Type | Shape of the chart: a `line`, a filled `area` or `column` bars. | `line`, `area`, `column`. Default: `line` |
| Smooth | Draws a `line` or `area` as a smooth curve instead of straight segments. | On or off. Default: On |
| Color by trend | Colors the chart green when the last value is higher than the first and red when it's lower. | On or off. Default: Off |
| Lower is better | Swaps the trend colors, so a fall is green and a rise is red, for figures such as costs or errors. | On or off. Default: Off |
| Color | Color of the chart. It overrides **Color by trend**. Leave it empty to use the theme's primary color. | Text |
| Value prefix | Text shown before the value in the tooltip, such as `$`. | Text |
| Value suffix | Text shown after the value in the tooltip, such as `%` or ` users`. | Text |
| Empty text | Text shown when there's no data. | Text. Default: `No data` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the chart. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Values to plot in order, as numbers such as `[12, 18, 15, 22]` or as rows such as `[{ value: 12 }]`. | `{{components.sparkline1.data}}` |
| `valueField` | Field that holds the number when **Data** is a list of rows. | `{{components.sparkline1.valueField}}` |
| `type` | Shape of the chart: a `line`, a filled `area` or `column` bars. | `{{components.sparkline1.type}}` |
| `smooth` | Draws a `line` or `area` as a smooth curve instead of straight segments. | `{{components.sparkline1.smooth}}` |
| `colorByTrend` | Colors the chart green when the last value is higher than the first and red when it's lower. | `{{components.sparkline1.colorByTrend}}` |
| `lowerIsBetter` | Swaps the trend colors, so a fall is green and a rise is red, for figures such as costs or errors. | `{{components.sparkline1.lowerIsBetter}}` |
| `color` | Color of the chart. It overrides **Color by trend**. Leave it empty to use the theme's primary color. | `{{components.sparkline1.color}}` |
| `valuePrefix` | Text shown before the value in the tooltip, such as `$`. | `{{components.sparkline1.valuePrefix}}` |
| `valueSuffix` | Text shown after the value in the tooltip, such as `%` or ` users`. | `{{components.sparkline1.valueSuffix}}` |
| `emptyText` | Text shown when there's no data. | `{{components.sparkline1.emptyText}}` |
| `trend` | Direction from the first value to the last: `up`, `down` or `flat`, or empty with fewer than two values. | `{{components.sparkline1.trend}}` |
| `lastValue` | The last value in the data. | `{{components.sparkline1.lastValue}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
