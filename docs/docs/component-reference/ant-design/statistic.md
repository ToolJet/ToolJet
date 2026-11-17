---
id: statistic
title: Statistic
---

<div className="badge badge--primary">Ant Design</div>

The **Statistic** component is Ant Design's stat display. It shows one key figure, such as revenue or open tickets, with a title and an optional up or down trend.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Label shown above the figure. | Text. Default: `Monthly revenue` |
| Value | The figure to show. A number is formatted by **Formatter**; text shows as it is. | Text. Default: `48250` |
| Formatter | How a number is written. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `auto` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Precision | Number of decimal places. Leave it empty to use the format's own. | Number |
| Prefix | Text shown before the figure, such as a unit. | Text |
| Suffix | Text shown after the figure, such as `orders` or `ms`. | Text |
| Trend | Direction of the change. `up` and `down` add an arrow before **Trend value**. | `neutral`, `up`, `down`. Default: `neutral` |
| Trend value | The change shown under the figure, such as `12%` or `+340`. | Text |
| Extra | Text shown after the trend, such as `vs last month`. | Text |
| Card | Draws the statistic inside a bordered card. | On or off. Default: On |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set trend | Sets the trend direction to **Trend** (`up`, `down` or `neutral`) and, when given, the change to **Trend value**. | `components.statistic1.setTrend("up", "")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | Label shown above the figure. | `{{components.statistic1.title}}` |
| `value` | The figure to show. A number is formatted by **Formatter**; text shows as it is. | `{{components.statistic1.value}}` |
| `formatter` | How a number is written. `auto` keeps whole numbers whole and others to two decimals, `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `{{components.statistic1.formatter}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Formatter** is `currency`. | `{{components.statistic1.currency}}` |
| `locale` | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.statistic1.locale}}` |
| `precision` | Number of decimal places. Leave it empty to use the format's own. | `{{components.statistic1.precision}}` |
| `prefix` | Text shown before the figure, such as a unit. | `{{components.statistic1.prefix}}` |
| `suffix` | Text shown after the figure, such as `orders` or `ms`. | `{{components.statistic1.suffix}}` |
| `trend` | Direction of the change. `up` and `down` add an arrow before **Trend value**. | `{{components.statistic1.trend}}` |
| `trendValue` | The change shown under the figure, such as `12%` or `+340`. | `{{components.statistic1.trendValue}}` |
| `extra` | Text shown after the trend, such as `vs last month`. | `{{components.statistic1.extra}}` |
| `bordered` | Draws the statistic inside a bordered card. | `{{components.statistic1.bordered}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
