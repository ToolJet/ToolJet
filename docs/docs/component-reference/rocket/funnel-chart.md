---
id: funnel-chart
title: Funnel Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Funnel Chart** component shows how a count drops from one stage to the next, such as visitors to sign-ups to paying customers. Each stage is a bar sized against the largest stage, with its value and conversion rate.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | List of rows to chart, one per stage, in the order the stages run. Up to 24 stages are drawn. | Array |
| Stage field | Key in each row that holds the stage name. | Text. Default: `stage` |
| Value field | Key in each row that holds the stage's count. | Text. Default: `count` |
| Conversion % | Shows each stage's conversion rate as a percentage next to its value. | On or off. Default: On |
| Conversion from | What each stage's conversion rate compares against: the **Previous stage** or the **First stage**. | Previous stage, First stage. Default: Previous stage |
| Bar alignment | Whether bars are centered, for a funnel shape, or aligned to the left. | `center`, `left`. Default: `center` |
| Colour per stage | Gives each stage its own color from **Series colors (in order)**. When off, all stages share one color that fades down the funnel. | On or off. Default: Off |
| Value format | How values are written: `number`, `currency`, `percent` or `compact` (like `12.5K`). With `percent`, fractions such as `0.25` read as `25%`. | `number`, `currency`, `percent`, `compact`. Default: `number` |
| Currency code | Currency code used when **Value format** is `currency`, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Number and currency format, such as `pt-BR`. Leave it empty to follow the currency. | Text |
| Value prefix | Text added before each value. | Text |
| Value suffix | Text added after each value. | Text |
| Empty message | Message shown when there is no data to chart. | Text. Default: `No data` |
| Animate | Grows the bars in when the chart first draws. | On or off. Default: On |
| Series colors (in order) | Colors for the bars, in order. Leave it empty to use **Chart color**. | Array |
| Highlight clicked point | Emphasizes the clicked stage until another is clicked or **Clear clicked point** runs. | On or off. Default: Off |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a stage. |
| [On double click](../common-settings.md#events) | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked stage and removes its highlight. | `components.funnelchart1.clearClickedPoint()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | List of rows to chart, one per stage, in the order the stages run. Up to 24 stages are drawn. | `{{components.funnelchart1.data}}` |
| `stageField` | Key in each row that holds the stage name. | `{{components.funnelchart1.stageField}}` |
| `valueField` | Key in each row that holds the stage's count. | `{{components.funnelchart1.valueField}}` |
| `showConversion` | Shows each stage's conversion rate as a percentage next to its value. | `{{components.funnelchart1.showConversion}}` |
| `conversionBase` | What each stage's conversion rate compares against: the **Previous stage** or the **First stage**. | `{{components.funnelchart1.conversionBase}}` |
| `align` | Whether bars are centered, for a funnel shape, or aligned to the left. | `{{components.funnelchart1.align}}` |
| `colorByStage` | Gives each stage its own color from **Series colors (in order)**. When off, all stages share one color that fades down the funnel. | `{{components.funnelchart1.colorByStage}}` |
| `yAxisFormat` | How values are written: `number`, `currency`, `percent` or `compact` (like `12.5K`). With `percent`, fractions such as `0.25` read as `25%`. | `{{components.funnelchart1.yAxisFormat}}` |
| `currency` | Currency code used when **Value format** is `currency`, such as `USD` or `EUR`. | `{{components.funnelchart1.currency}}` |
| `locale` | Number and currency format, such as `pt-BR`. Leave it empty to follow the currency. | `{{components.funnelchart1.locale}}` |
| `valuePrefix` | Text added before each value. | `{{components.funnelchart1.valuePrefix}}` |
| `valueSuffix` | Text added after each value. | `{{components.funnelchart1.valueSuffix}}` |
| `emptyText` | Message shown when there is no data to chart. | `{{components.funnelchart1.emptyText}}` |
| `animate` | Grows the bars in when the chart first draws. | `{{components.funnelchart1.animate}}` |
| `colors` | Colors for the bars, in order. Leave it empty to use **Chart color**. | `{{components.funnelchart1.colors}}` |
| `highlightClicked` | Emphasizes the clicked stage until another is clicked or **Clear clicked point** runs. | `{{components.funnelchart1.highlightClicked}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.funnelchart1.loadingIndicator}}` |
| `clickedDataPoint` | The data row of the last stage the user clicked. | `{{components.funnelchart1.clickedDataPoint}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Stage label color | Theme: Placeholder text |
