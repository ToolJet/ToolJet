---
id: heatmap-chart
title: Heatmap Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Heatmap Chart** component shows values as a grid of shaded cells, such as tickets by weekday and hour or sales by region and month. Darker cells hold higher values.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | List of rows to chart. Rows that land in the same cell are added together. | Array |
| Column field | Key in each row that sets the cell's column. | Text. Default: `hour` |
| Row field | Key in each row that sets the cell's row. | Text. Default: `day` |
| Value field | Key in each row that holds the value to shade by. | Text. Default: `tickets` |
| Column order | Column labels in the order to show them. Labels not listed follow in the order they first appear in the data. | Array |
| Row order | Row labels in the order to show them. Labels not listed follow in the order they first appear in the data. | Array |
| Show values | Writes each cell's value inside it. | On or off. Default: Off |
| Cell gap (px) | Space between cells, in pixels. | Number. Default: `3` |
| Value format | How values are written: `number`, `currency`, `percent` or `compact` (like `12.5K`). With `percent`, fractions such as `0.25` read as `25%`. | `number`, `currency`, `percent`, `compact`. Default: `number` |
| Currency code | Currency code used when **Value format** is `currency`, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Number and currency format, such as `pt-BR`. Leave it empty to follow the currency. | Text |
| Value prefix | Text added before each value. | Text |
| Value suffix | Text added after each value. | Text |
| Empty message | Message shown when there is no data to chart. | Text. Default: `No data` |
| Legend | Shows a color scale from the lowest to the highest value under the grid. | On or off. Default: On |
| Highlight clicked point | Outlines the clicked cell and dims the others until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks a cell. |
| On double click | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked cell and removes its highlight. | `components.heatmapchart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.heatmapchart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.heatmapchart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.heatmapchart1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | List of rows to chart. Rows that land in the same cell are added together. | `{{components.heatmapchart1.data}}` |
| `xField` | Key in each row that sets the cell's column. | `{{components.heatmapchart1.xField}}` |
| `yField` | Key in each row that sets the cell's row. | `{{components.heatmapchart1.yField}}` |
| `valueField` | Key in each row that holds the value to shade by. | `{{components.heatmapchart1.valueField}}` |
| `xOrder` | Column labels in the order to show them. Labels not listed follow in the order they first appear in the data. | `{{components.heatmapchart1.xOrder}}` |
| `yOrder` | Row labels in the order to show them. Labels not listed follow in the order they first appear in the data. | `{{components.heatmapchart1.yOrder}}` |
| `showValues` | Writes each cell's value inside it. | `{{components.heatmapchart1.showValues}}` |
| `cellGap` | Space between cells, in pixels. | `{{components.heatmapchart1.cellGap}}` |
| `yAxisFormat` | How values are written: `number`, `currency`, `percent` or `compact` (like `12.5K`). With `percent`, fractions such as `0.25` read as `25%`. | `{{components.heatmapchart1.yAxisFormat}}` |
| `currency` | Currency code used when **Value format** is `currency`, such as `USD` or `EUR`. | `{{components.heatmapchart1.currency}}` |
| `locale` | Number and currency format, such as `pt-BR`. Leave it empty to follow the currency. | `{{components.heatmapchart1.locale}}` |
| `valuePrefix` | Text added before each value. | `{{components.heatmapchart1.valuePrefix}}` |
| `valueSuffix` | Text added after each value. | `{{components.heatmapchart1.valueSuffix}}` |
| `emptyText` | Message shown when there is no data to chart. | `{{components.heatmapchart1.emptyText}}` |
| `showLegend` | Shows a color scale from the lowest to the highest value under the grid. | `{{components.heatmapchart1.showLegend}}` |
| `highlightClicked` | Outlines the clicked cell and dims the others until another is clicked or **Clear clicked point** runs. | `{{components.heatmapchart1.highlightClicked}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.heatmapchart1.loadingIndicator}}` |
| `clickedDataPoint` | The last cell the user clicked, with its row label, column label and value under the **Row field**, **Column field** and **Value field** keys. | `{{components.heatmapchart1.clickedDataPoint}}` |
| `isVisible` | Whether the component is visible. | `{{components.heatmapchart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.heatmapchart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.heatmapchart1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (the strongest cell) | Theme: Brand primary |
| Label color | Theme: Placeholder text |
| Legend text color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
