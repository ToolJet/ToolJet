---
id: funnel-chart
title: Funnel Chart
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Funnel Chart** component shows how a count drops from one stage to the next, such as visitors to sign-ups to paying customers. Each stage is a bar sized against the largest stage, with its value and conversion rate.

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
| On click | Triggers when the user clicks a stage. |
| On double click | Triggers when the user double-clicks the chart. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked stage and removes its highlight. | `components.funnelchart1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.funnelchart1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.funnelchart1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.funnelchart1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.funnelchart1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.funnelchart1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.funnelchart1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Chart color (series palette from it) | Theme: Brand primary |
| Stage label color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
