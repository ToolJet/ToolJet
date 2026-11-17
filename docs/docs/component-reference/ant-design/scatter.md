---
id: scatter
title: Scatter
---

<div className="badge badge--primary">Ant Design</div>

The **Scatter** component is Ant Design's scatter chart. It plots rows as points by two numbers, to show how they relate, such as deal size against days to close.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to chart, one per point, such as `[{ x: 12, y: 34 }]`. | Array |
| X field | Field in each row that holds the number on the horizontal axis. | Text. Default: `x` |
| Y field | Field that holds the number on the vertical axis. With a list of fields, only the first is plotted. | Array. Default: `["y"]` |
| Color field | Field that names each point's group. Each group gets its own color. | Text |
| Title | Heading shown above the chart. | Text |
| Legend | Where the legend sits, or `none` to hide it. The legend shows only when the chart has more than one series. | `top`, `bottom`, `right`, `none`. Default: `top` |
| Label | Shows each data point's value on the chart. | On or off. Default: Off |
| Y formatter | How values on the value axis, labels and tooltips are written. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `compact` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Highlight clicked point | Keeps the point the user clicked highlighted and fades the others until **Clear clicked point** runs. | On or off. Default: Off |
| Size field | Number field that sets each point's size, which turns the chart into a bubble chart. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On element click](../common-settings.md#events) | Triggers when the user clicks a point. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked point, which empties **selectedDatum** and removes the highlight. | `components.scatter1.clearClickedPoint()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to chart, one per point, such as `[{ x: 12, y: 34 }]`. | `{{components.scatter1.data}}` |
| `xField` | Field in each row that holds the number on the horizontal axis. | `{{components.scatter1.xField}}` |
| `yField` | Field that holds the number on the vertical axis. With a list of fields, only the first is plotted. | `{{components.scatter1.yField}}` |
| `colorField` | Field that names each point's group. Each group gets its own color. | `{{components.scatter1.colorField}}` |
| `title` | Heading shown above the chart. | `{{components.scatter1.title}}` |
| `legend` | Where the legend sits, or `none` to hide it. The legend shows only when the chart has more than one series. | `{{components.scatter1.legend}}` |
| `label` | Shows each data point's value on the chart. | `{{components.scatter1.label}}` |
| `yFormatter` | How values on the value axis, labels and tooltips are written. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `{{components.scatter1.yFormatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | `{{components.scatter1.currency}}` |
| `locale` | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.scatter1.locale}}` |
| `highlightClicked` | Keeps the point the user clicked highlighted and fades the others until **Clear clicked point** runs. | `{{components.scatter1.highlightClicked}}` |
| `sizeField` | Number field that sets each point's size, which turns the chart into a bubble chart. | `{{components.scatter1.sizeField}}` |
| `selectedDatum` | The data row of the point the user clicked last, or `{}` after **Clear clicked point**. | `{{components.scatter1.selectedDatum}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
