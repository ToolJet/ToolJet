---
id: statistic
title: Statistic
---

<div className="badge badge--primary">Ant Design</div>

The **Statistic** component is Ant Design's stat display. It shows one key figure, such as revenue or open tickets, with a title and an optional up or down trend.

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

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set trend | Sets the trend direction to **Trend** (`up`, `down` or `neutral`) and, when given, the change to **Trend value**. | `components.statistic1.setTrend("up", "")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.statistic1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.statistic1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.statistic1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.statistic1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.statistic1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.statistic1.isDisabled}}` |

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
