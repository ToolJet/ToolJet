---
id: pie
title: Pie
---

<div className="badge badge--primary">Ant Design</div>

The **Pie** component is Ant Design's pie and donut chart. It shows how a total splits across categories, such as revenue by product or tickets by status.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On element click](../common-settings.md#events) | Triggers when the user clicks a slice. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear clicked point | Clears the clicked slice, which empties **selectedDatum** and removes the highlight. | `components.pie1.clearClickedPoint()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
