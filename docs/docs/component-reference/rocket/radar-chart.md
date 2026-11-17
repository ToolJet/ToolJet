---
id: radar-chart
title: Radar Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Radar Chart** component compares one or more series across several categories on spokes around a center, such as scoring vendors or team members on the same set of skills.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to chart, one spoke per row. | Array |
| Category field | Field in each row that names the spoke. | Text. Default: `skill` |
| Series fields (one or many) | Field or fields that hold each series' values, as one name, a list or a comma-separated list. Each field is drawn as its own shape. | Text. Default: `alex, jordan` |
| Max value (blank = auto) | Value at the outer edge of the chart. Leave empty to set it from the data. | Text. Default: `100` |
| Fill opacity (0 to 1) | How solid the filled shapes are, from `0` (outline only) to `1` (solid). | Number. Default: `0.5` |
| Grid shape | Shape of the background grid: straight-sided **polygon** rings or round **circle** rings. | `polygon`, `circle`. Default: `polygon` |
| Grid | Shows the background grid of rings and spokes. | On or off. Default: On |
| Dots | Marks each value with a dot on the shape's outline. | On or off. Default: Off |
| Value prefix | Text shown before values in the tooltip, such as `$`. | Text |
| Value suffix | Text shown after values in the tooltip, such as `%`. | Text |
| Empty message | Message shown when there is no data to chart. | Text. Default: `No data` |
| Animate | Animates the shapes when the chart first draws or its data changes. | On or off. Default: On |
| Legend | Shows a legend that names each series and its color. | On or off. Default: On |
| Series labels (\{ field: label \}) | Names to show for the series instead of their field names, for example `{ "alex": "Alex" }`. | Object |
| Series colors (in order) | Colors for the series, used in order. Leave empty to use the theme's chart colors. | Array |
| Highlight clicked point | Rings the clicked category's point on each series until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What shows while the chart is loading: a spinner or a skeleton block. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a category on the chart. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked point and its highlight. | `components.radarchart1.clearClickedPoint()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to chart, one spoke per row. | `{{components.radarchart1.data}}` |
| `categoryField` | Field in each row that names the spoke. | `{{components.radarchart1.categoryField}}` |
| `yFields` | Field or fields that hold each series' values, as one name, a list or a comma-separated list. Each field is drawn as its own shape. | `{{components.radarchart1.yFields}}` |
| `maxValue` | Value at the outer edge of the chart. Leave empty to set it from the data. | `{{components.radarchart1.maxValue}}` |
| `fillOpacity` | How solid the filled shapes are, from `0` (outline only) to `1` (solid). | `{{components.radarchart1.fillOpacity}}` |
| `gridShape` | Shape of the background grid: straight-sided **polygon** rings or round **circle** rings. | `{{components.radarchart1.gridShape}}` |
| `showGrid` | Shows the background grid of rings and spokes. | `{{components.radarchart1.showGrid}}` |
| `showDots` | Marks each value with a dot on the shape's outline. | `{{components.radarchart1.showDots}}` |
| `valuePrefix` | Text shown before values in the tooltip, such as `$`. | `{{components.radarchart1.valuePrefix}}` |
| `valueSuffix` | Text shown after values in the tooltip, such as `%`. | `{{components.radarchart1.valueSuffix}}` |
| `emptyText` | Message shown when there is no data to chart. | `{{components.radarchart1.emptyText}}` |
| `animate` | Animates the shapes when the chart first draws or its data changes. | `{{components.radarchart1.animate}}` |
| `showLegend` | Shows a legend that names each series and its color. | `{{components.radarchart1.showLegend}}` |
| `seriesLabels` | Names to show for the series instead of their field names, for example `{ "alex": "Alex" }`. | `{{components.radarchart1.seriesLabels}}` |
| `colors` | Colors for the series, used in order. Leave empty to use the theme's chart colors. | `{{components.radarchart1.colors}}` |
| `highlightClicked` | Rings the clicked category's point on each series until another is clicked or **Clear clicked point** runs. | `{{components.radarchart1.highlightClicked}}` |
| `loadingIndicator` | What shows while the chart is loading: a spinner or a skeleton block. | `{{components.radarchart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the category the user clicked last, with every series' value. | `{{components.radarchart1.clickedDataPoint}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Grid line color | Theme: Default border |
| Axis label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
