---
id: heatmap
title: Heatmap
---

<div className="badge badge--primary">Ant Design</div>

The **Heatmap** chart shows a grid of cells shaded by value, which reveals patterns across two categories, such as order volume by weekday and time of day.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | The cells to show, one row per pair of x and y values, such as `[{ day, hour, value }]`. | Array |
| X field | Name of the field in **Data** that holds the column category, such as a weekday. | Text. Default: `x` |
| Y field | Name of the field that holds the row category, such as a time of day. | Text. Default: `y` |
| Color field | Name of the field that holds each cell's number. Higher values get a darker shade. | Text. Default: `value` |
| Title | Heading shown above the chart. | Text |
| Label | Shows each cell's value inside the cell. | On or off. Default: Off |
| Highlight clicked point | Keeps the clicked cell at full strength and fades the rest, until another cell is clicked or **Clear clicked point** runs. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On element click](../common-settings.md#events) | Triggers when the user clicks a cell. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked mark, which empties `selectedDatum` and removes the highlight. | `components.heatmap1.clearClickedPoint()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The cells to show, one row per pair of x and y values, such as `[{ day, hour, value }]`. | `{{components.heatmap1.data}}` |
| `xField` | Name of the field in **Data** that holds the column category, such as a weekday. | `{{components.heatmap1.xField}}` |
| `yField` | Name of the field that holds the row category, such as a time of day. | `{{components.heatmap1.yField}}` |
| `colorField` | Name of the field that holds each cell's number. Higher values get a darker shade. | `{{components.heatmap1.colorField}}` |
| `title` | Heading shown above the chart. | `{{components.heatmap1.title}}` |
| `label` | Shows each cell's value inside the cell. | `{{components.heatmap1.label}}` |
| `highlightClicked` | Keeps the clicked cell at full strength and fades the rest, until another cell is clicked or **Clear clicked point** runs. | `{{components.heatmap1.highlightClicked}}` |
| `selectedDatum` | The data row of the cell the user clicked last. It is empty after **Clear clicked point**. | `{{components.heatmap1.selectedDatum}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
