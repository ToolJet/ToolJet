---
id: summary-strip
title: Summary Strip
---

<div className="badge badge--primary">Ant Design</div>

The **Summary Strip** component shows a row of key figures side by side, each with a label, a value and an optional change, such as revenue, orders and refund rate at the top of a dashboard.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The figures, up to six, each with a `label`, a `value` and optional `delta`, `caption`, `format`, `deltaFormat`, `tone` and `lowerIsBetter`, such as `[{ label: 'Revenue', value: 48250, delta: 0.12, caption: 'vs last month' }]`. | Array |
| Value format | How values are written when an item sets no `format` of its own. `percent` reads 0.021 as 2.1%, `compact` shortens large numbers to 12K or 1.2M, and `auto` shows money labels such as Revenue as currency. | `auto`, `number`, `currency`, `percent`, `compact`, `date`. Default: `auto` |
| Currency | Currency code, such as `USD` or `EUR`, for values and changes shown as currency. | Text. Default: `USD` |
| Locale | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Delta format | How a numeric `delta` is written. With `percent`, 0.12 shows as +12%. A rise shows a green up arrow and a fall a red down arrow, swapped for items with `lowerIsBetter`. | `percent`, `number`, `currency`. Default: `percent` |
| Appearance | Frame around the figures. `panel` puts them in one bordered panel with dividers, `cards` gives each figure its own card, and `plain` has no frame. | `panel`, `plain`, `cards`. Default: `panel` |
| Size | Size of the figures: `sm` for small, `lg` for large. | `sm`, `default`, `lg`. Default: `default` |
| Align | Alignment of the text in each figure. | `left`, `center`. Default: `left` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The figures, up to six, each with a `label`, a `value` and optional `delta`, `caption`, `format`, `deltaFormat`, `tone` and `lowerIsBetter`, such as `[{ label: 'Revenue', value: 48250, delta: 0.12, caption: 'vs last month' }]`. | `{{components.summarystrip1.items}}` |
| `valueFormat` | How values are written when an item sets no `format` of its own. `percent` reads 0.021 as 2.1%, `compact` shortens large numbers to 12K or 1.2M, and `auto` shows money labels such as Revenue as currency. | `{{components.summarystrip1.valueFormat}}` |
| `currency` | Currency code, such as `USD` or `EUR`, for values and changes shown as currency. | `{{components.summarystrip1.currency}}` |
| `locale` | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.summarystrip1.locale}}` |
| `deltaFormat` | How a numeric `delta` is written. With `percent`, 0.12 shows as +12%. A rise shows a green up arrow and a fall a red down arrow, swapped for items with `lowerIsBetter`. | `{{components.summarystrip1.deltaFormat}}` |
| `appearance` | Frame around the figures. `panel` puts them in one bordered panel with dividers, `cards` gives each figure its own card, and `plain` has no frame. | `{{components.summarystrip1.appearance}}` |
| `size` | Size of the figures: `sm` for small, `lg` for large. | `{{components.summarystrip1.size}}` |
| `align` | Alignment of the text in each figure. | `{{components.summarystrip1.align}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
