---
id: radial-chart
title: Radial Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Radial Chart** component draws values as arcs around a center. Show one value as a progress ring or gauge, such as tasks completed against a target, or compare categories as concentric rings, such as visitors by channel.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Mode | **progress** shows **Value** against **Max value** as a single ring; **categories** draws one ring per data row. | `progress`, `categories`. Default: `progress` |
| Value | Value to show in **progress** mode. | Number. Default: `72` |
| Max value | Value that fills the ring completely. In **categories** mode, rings fill against this or the largest value, whichever is higher. | Number. Default: `100` |
| Data (categories mode) | Rows to chart in **categories** mode, one ring per row. The first row is the outer ring. | Array |
| Category field | Field in each row that names the ring, in **categories** mode. | Text. Default: `channel` |
| Value field | Field in each row that sets the ring's length, in **categories** mode. | Text. Default: `visitors` |
| Center figure (blank = the value) | Large figure shown in the middle. Leave empty to show **Value** in **progress** mode. | Text |
| Center caption | Caption shown under the figure in the middle. | Text. Default: `Completed` |
| Start angle | Angle in degrees where the arc starts, counted counter-clockwise from 3 o'clock. `90` and `-270` give a full ring from the top; `180` and `0` give a half-circle gauge. | Number. Default: `90` |
| End angle | Angle in degrees where the arc ends. See **Start angle**. | Number. Default: `-270` |
| Ring thickness (px, blank = auto) | Width of each ring in pixels. Leave empty to size it to the chart. | Text |
| Rounded ends | Rounds the ends of the arcs. | On or off. Default: On |
| Track | Shows a faint full-length track behind each arc. | On or off. Default: On |
| Value prefix | Text shown before values, such as `$`. | Text |
| Value suffix | Text shown after values. `auto` adds `%` in **progress** mode and nothing in **categories** mode. | Text. Default: `auto` |
| Empty message | Message shown when there is nothing to chart. | Text. Default: `No data` |
| Animate | Animates the arcs when the chart first draws or its data changes. | On or off. Default: On |
| Legend (categories mode) | Shows a legend that names each ring and its color, in **categories** mode. | On or off. Default: On |
| Series colors (in order) | Colors for the rings, used in order. Leave empty to use the theme's chart colors. A row's own `color` or `fill` field wins. | Array |
| Highlight clicked point | Keeps the clicked ring highlighted and dims the others until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What shows while the chart is loading: a spinner or a skeleton block. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a ring. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked ring and its highlight. | `components.radialchart1.clearClickedPoint()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `mode` | **progress** shows **Value** against **Max value** as a single ring; **categories** draws one ring per data row. | `{{components.radialchart1.mode}}` |
| `value` | Value to show in **progress** mode. | `{{components.radialchart1.value}}` |
| `maxValue` | Value that fills the ring completely. In **categories** mode, rings fill against this or the largest value, whichever is higher. | `{{components.radialchart1.maxValue}}` |
| `data` | Rows to chart in **categories** mode, one ring per row. The first row is the outer ring. | `{{components.radialchart1.data}}` |
| `categoryField` | Field in each row that names the ring, in **categories** mode. | `{{components.radialchart1.categoryField}}` |
| `valueField` | Field in each row that sets the ring's length, in **categories** mode. | `{{components.radialchart1.valueField}}` |
| `centerValue` | Large figure shown in the middle. Leave empty to show **Value** in **progress** mode. | `{{components.radialchart1.centerValue}}` |
| `centerLabel` | Caption shown under the figure in the middle. | `{{components.radialchart1.centerLabel}}` |
| `startAngle` | Angle in degrees where the arc starts, counted counter-clockwise from 3 o'clock. `90` and `-270` give a full ring from the top; `180` and `0` give a half-circle gauge. | `{{components.radialchart1.startAngle}}` |
| `endAngle` | Angle in degrees where the arc ends. See **Start angle**. | `{{components.radialchart1.endAngle}}` |
| `thickness` | Width of each ring in pixels. Leave empty to size it to the chart. | `{{components.radialchart1.thickness}}` |
| `rounded` | Rounds the ends of the arcs. | `{{components.radialchart1.rounded}}` |
| `showTrack` | Shows a faint full-length track behind each arc. | `{{components.radialchart1.showTrack}}` |
| `valuePrefix` | Text shown before values, such as `$`. | `{{components.radialchart1.valuePrefix}}` |
| `valueSuffix` | Text shown after values. `auto` adds `%` in **progress** mode and nothing in **categories** mode. | `{{components.radialchart1.valueSuffix}}` |
| `emptyText` | Message shown when there is nothing to chart. | `{{components.radialchart1.emptyText}}` |
| `animate` | Animates the arcs when the chart first draws or its data changes. | `{{components.radialchart1.animate}}` |
| `showLegend` | Shows a legend that names each ring and its color, in **categories** mode. | `{{components.radialchart1.showLegend}}` |
| `colors` | Colors for the rings, used in order. Leave empty to use the theme's chart colors. A row's own `color` or `fill` field wins. | `{{components.radialchart1.colors}}` |
| `highlightClicked` | Keeps the clicked ring highlighted and dims the others until another is clicked or **Clear clicked point** runs. | `{{components.radialchart1.highlightClicked}}` |
| `loadingIndicator` | What shows while the chart is loading: a spinner or a skeleton block. | `{{components.radialchart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the ring the user clicked last. In **progress** mode it holds `value` and `maxValue`. | `{{components.radialchart1.clickedDataPoint}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Track color | Theme: Surface 3 |
| Legend text color | Theme: Placeholder text |
| Center figure color | Theme: Primary text |
| Center caption color | Theme: Placeholder text |
