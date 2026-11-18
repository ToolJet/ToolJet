---
id: pie
title: Pie
---

<div className="badge badge--primary">Ant Design</div>

The **Pie** component is Ant Design's pie and donut chart. It shows how a total splits across categories, such as revenue by product or tickets by status.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to chart, one per slice, such as `[{ type: 'Charter', value: 62 }]`. | Array |
| Angle field | Field in each row that holds the slice's value. | Text. Default: `value` |
| Color field | Field in each row that names the slice's category. | Text. Default: `type` |
| Inner radius | Size of the hole in the middle, from `0` for a full pie to `0.9` for a thin ring. | Number. Default: `0.6` |
| Title | Heading shown above the chart. | Text |
| Legend | Where the legend of categories sits, or `none` to hide it. On a narrow chart, `right` moves under the chart. | `right`, `bottom`, `top`, `none`. Default: `right` |
| Label | Shows each slice's share of the total as a percent on the slice. | On or off. Default: Off |
| Formatter | How values are written in tooltips. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `auto` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Highlight clicked point | Keeps the point the user clicked highlighted and fades the others until **Clear clicked point** runs. | On or off. Default: Off |

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
| On element click | Triggers when the user clicks a slice. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked slice, which empties **selectedDatum** and removes the highlight. | `components.pie1.clearClickedPoint()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.pie1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.pie1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.pie1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to chart, one per slice, such as `[{ type: 'Charter', value: 62 }]`. | `{{components.pie1.data}}` |
| `angleField` | Field in each row that holds the slice's value. | `{{components.pie1.angleField}}` |
| `colorField` | Field in each row that names the slice's category. | `{{components.pie1.colorField}}` |
| `innerRadius` | Size of the hole in the middle, from `0` for a full pie to `0.9` for a thin ring. | `{{components.pie1.innerRadius}}` |
| `title` | Heading shown above the chart. | `{{components.pie1.title}}` |
| `legend` | Where the legend of categories sits, or `none` to hide it. On a narrow chart, `right` moves under the chart. | `{{components.pie1.legend}}` |
| `label` | Shows each slice's share of the total as a percent on the slice. | `{{components.pie1.label}}` |
| `formatter` | How values are written in tooltips. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `{{components.pie1.formatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | `{{components.pie1.currency}}` |
| `locale` | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.pie1.locale}}` |
| `highlightClicked` | Keeps the point the user clicked highlighted and fades the others until **Clear clicked point** runs. | `{{components.pie1.highlightClicked}}` |
| `selectedDatum` | The data row of the slice the user clicked last, or `{}` after **Clear clicked point**. | `{{components.pie1.selectedDatum}}` |
| `isVisible` | Whether the component is visible. | `{{components.pie1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.pie1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.pie1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
