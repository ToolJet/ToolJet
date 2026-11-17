---
id: stat
title: Stat
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Stat** component is a KPI card that shows one key figure with its label, such as total revenue or open tickets. It can add a change chip, an icon, a small trend line and a progress bar.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the figure, such as `Total revenue`. | Text. Default: `Total revenue` |
| Value | The figure to show. Numbers get digit grouping; text shows as written. | Text. Default: `1250` |
| Value format | How the figure is written, such as plain numbers, currency, percent or short forms like `12K`. **Auto** keeps it as given. | Auto, Number, Currency, Percent, Compact. Default: Auto |
| Currency (ISO code, e.g. USD) | Currency code used when **Value format** or **Change format** is currency, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Locale used to format numbers and currency, such as `en-US`. Leave empty to follow the currency. | Text |
| Change (e.g. +12.5%) | Change shown in a chip next to the figure, such as `+12.5%`. A leading `+` or `-` sets whether it points up or down. | Text |
| Change format | How a numeric **Change** is written. | Percent, Number, Currency. Default: Number |
| Trend | Direction of the change chip when **Change** has no sign of its own. | Up, Down, Neutral. Default: Up |
| Change context (e.g. vs last month) | Text shown after the change chip, such as `vs last month`. | Text |
| Footnote | Small text shown at the bottom of the card. | Text |
| Icon (lucide name, e.g. wallet) | Icon shown on the card, by Lucide or Tabler name, such as `wallet`. | Text |
| Icon position | Where the icon sits: to the right or left of the figure, or above it. | Right, Left, Top. Default: Right |
| Icon style | Background behind the icon: a rounded **Square**, a **Circle**, or **None**. | Square, Circle, None. Default: Square |
| Trend data (numbers or [\{ x, y \}]) | Values for a small trend line at the bottom of the card, as numbers or `{ x, y }` objects. | Text |
| Trend line | Draw the trend line as a filled **Area** or a plain **Line**. | Area, Line. Default: Area |
| Progress (0 to 100) | Percent from `0` to `100` shown as a progress bar on the card. | Text |
| Progress label | Text shown with the progress bar. | Text |
| Size | Size of the figure and the spacing of the card. | Sm, Default, Lg. Default: Default |
| Show as card | Draws the stat in a card with a border and background. When off, it sits directly on the page. | On or off. Default: On |
| Loading look | What shows while the stat is loading: a spinner or a skeleton outline. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the stat. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set primary value | Sets the figure to the given **Value**. | `components.stat1.setPrimaryValue("")` |
| Set secondary value | Sets the change chip to the given **Change**. | `components.stat1.setSecondaryValue("")` |
| Set trend | Sets the direction of the change chip to `up`, `down` or `neutral`. | `components.stat1.setTrend("up")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the figure, such as `Total revenue`. | `{{components.stat1.label}}` |
| `value` | The figure to show. Numbers get digit grouping; text shows as written. | `{{components.stat1.value}}` |
| `valueFormat` | How the figure is written, such as plain numbers, currency, percent or short forms like `12K`. **Auto** keeps it as given. | `{{components.stat1.valueFormat}}` |
| `currency` | Currency code used when **Value format** or **Change format** is currency, such as `USD` or `EUR`. | `{{components.stat1.currency}}` |
| `locale` | Locale used to format numbers and currency, such as `en-US`. Leave empty to follow the currency. | `{{components.stat1.locale}}` |
| `change` | Change shown in a chip next to the figure, such as `+12.5%`. A leading `+` or `-` sets whether it points up or down. | `{{components.stat1.change}}` |
| `changeFormat` | How a numeric **Change** is written. | `{{components.stat1.changeFormat}}` |
| `trend` | Direction of the change chip when **Change** has no sign of its own. | `{{components.stat1.trend}}` |
| `changeLabel` | Text shown after the change chip, such as `vs last month`. | `{{components.stat1.changeLabel}}` |
| `footnote` | Small text shown at the bottom of the card. | `{{components.stat1.footnote}}` |
| `icon` | Icon shown on the card, by Lucide or Tabler name, such as `wallet`. | `{{components.stat1.icon}}` |
| `iconPosition` | Where the icon sits: to the right or left of the figure, or above it. | `{{components.stat1.iconPosition}}` |
| `iconStyle` | Background behind the icon: a rounded **Square**, a **Circle**, or **None**. | `{{components.stat1.iconStyle}}` |
| `trendData` | Values for a small trend line at the bottom of the card, as numbers or `{ x, y }` objects. | `{{components.stat1.trendData}}` |
| `sparklineType` | Draw the trend line as a filled **Area** or a plain **Line**. | `{{components.stat1.sparklineType}}` |
| `progress` | Percent from `0` to `100` shown as a progress bar on the card. | `{{components.stat1.progress}}` |
| `progressLabel` | Text shown with the progress bar. | `{{components.stat1.progressLabel}}` |
| `size` | Size of the figure and the spacing of the card. | `{{components.stat1.size}}` |
| `card` | Draws the stat in a card with a border and background. When off, it sits directly on the page. | `{{components.stat1.card}}` |
| `loadingIndicator` | What shows while the stat is loading: a spinner or a skeleton outline. | `{{components.stat1.loadingIndicator}}` |
| `primaryLabel` | The label shown above the figure. | `{{components.stat1.primaryLabel}}` |
| `primaryValue` | The figure shown, including one set with **Set primary value**. | `{{components.stat1.primaryValue}}` |
| `secondaryLabel` | The change context text. | `{{components.stat1.secondaryLabel}}` |
| `secondaryValue` | The change shown in the chip. | `{{components.stat1.secondaryValue}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Card shadow | `0px 0px 0px 0px #00000040` |
| Card background | Theme: Surface 1 |
| Card border color | Theme: Default border |
| Card radius | — |
| Label color | Theme: Placeholder text |
| Value color | Theme: Primary text |
| Footnote color | Theme: Placeholder text |
| Change color when trend is up | Theme: Primary text |
| Change color when trend is down | Theme: Primary text |
| Icon color | Theme: Brand primary |
| Icon tile color | Theme: Brand primary |
| Trend line color | Theme: Brand primary |
| Progress color | Theme: Brand primary |
| Value typeface | Theme font |
| Label casing | As typed |
| Label letter spacing (px, or em like 0.12em) | — |
