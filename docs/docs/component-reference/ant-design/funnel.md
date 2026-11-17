---
id: funnel
title: Funnel
---

<div className="badge badge--primary">Ant Design</div>

The **Funnel** chart shows how many items reach each stage of a process, such as visitors, signups and purchases, with each stage's share of the first stage.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | The stages to show, in order from first to last, such as `[{ stage, value }]`. | Array |
| X field | Name of the field in **Data** that holds the stage name. | Text. Default: `stage` |
| Y field | Name of the field that holds the stage's value. | Array. Default: `["value"]` |
| Color field | This chart colors each stage on its own, so this setting has no visible effect. | Text |
| Title | Heading shown above the chart. | Text |
| Legend | This chart shows no legend, so this setting has no visible effect. | `top`, `bottom`, `right`, `none`. Default: `top` |
| Label | This chart always labels each stage with its name, value and share of the first stage, so this setting has no visible effect. | On or off. Default: Off |
| Y formatter | How values in labels and tooltips are written. `compact` shortens large numbers, such as `1.2K`; `percent` reads `0.25` as `25%`; `auto` shows whole numbers with no decimals and others with up to two. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `compact` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Highlight clicked point | Keeps the clicked mark at full strength and fades the rest, until another mark is clicked or **Clear clicked point** runs. | On or off. Default: Off |

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
| On element click | Triggers when the user clicks a mark on the chart, such as a bar or point. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked mark, which empties `selectedDatum` and removes the highlight. | `components.funnel1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.funnel1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.funnel1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.funnel1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | The stages to show, in order from first to last, such as `[{ stage, value }]`. | `{{components.funnel1.data}}` |
| `xField` | Name of the field in **Data** that holds the stage name. | `{{components.funnel1.xField}}` |
| `yField` | Name of the field that holds the stage's value. | `{{components.funnel1.yField}}` |
| `colorField` | This chart colors each stage on its own, so this setting has no visible effect. | `{{components.funnel1.colorField}}` |
| `title` | Heading shown above the chart. | `{{components.funnel1.title}}` |
| `legend` | This chart shows no legend, so this setting has no visible effect. | `{{components.funnel1.legend}}` |
| `label` | This chart always labels each stage with its name, value and share of the first stage, so this setting has no visible effect. | `{{components.funnel1.label}}` |
| `yFormatter` | How values in labels and tooltips are written. `compact` shortens large numbers, such as `1.2K`; `percent` reads `0.25` as `25%`; `auto` shows whole numbers with no decimals and others with up to two. | `{{components.funnel1.yFormatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Y formatter** is `currency`. | `{{components.funnel1.currency}}` |
| `locale` | Locale for number and currency formats, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.funnel1.locale}}` |
| `highlightClicked` | Keeps the clicked mark at full strength and fades the rest, until another mark is clicked or **Clear clicked point** runs. | `{{components.funnel1.highlightClicked}}` |
| `selectedDatum` | The data row of the mark the user clicked last. It is empty after **Clear clicked point**. | `{{components.funnel1.selectedDatum}}` |
| `isVisible` | Whether the component is visible. | `{{components.funnel1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.funnel1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.funnel1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
