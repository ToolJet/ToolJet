---
id: summary-strip
title: Summary Strip
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Summary Strip** component shows a row of headline figures side by side, each with a label and an optional change, such as revenue, orders and refund rate at the top of a dashboard.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Figures | Figures to show, each with a `label` and a `value`. Each can add a `delta` (the change), a `caption`, its own `format` or `deltaFormat`, a `tone`, and `lowerIsBetter` to color a fall as good. | Array |
| Value format | How figures are written unless a figure sets its own `format`, such as plain numbers, currency, percent, short forms like `12K`, or dates. | Auto, Number, Currency, Percent, Compact, Date. Default: Auto |
| Currency (ISO code, e.g. USD) | Currency code used for figures formatted as currency, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Locale used to format numbers, currency and dates, such as `en-US`. Leave empty to follow the currency. | Text |
| Change format (numbers) | How a numeric change is written unless a figure sets its own `deltaFormat`. | Percent, Number, Currency. Default: Percent |
| Appearance | **Panel** groups the figures in one bordered box, **Plain** shows them without a box, and **Cards** puts each figure in its own box. | Panel, Plain, Cards. Default: Panel |
| Size | Size of the figures and their spacing. | Small, Default, Large. Default: Default |
| Align | Whether each figure's text is aligned left or centered. | Left, Center. Default: Left |
| Loading look | What shows while the component is loading: a spinner or a skeleton outline. | Spinner, Skeleton. Default: Spinner |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | Figures to show, each with a `label` and a `value`. Each can add a `delta` (the change), a `caption`, its own `format` or `deltaFormat`, a `tone`, and `lowerIsBetter` to color a fall as good. | `{{components.summarystrip1.items}}` |
| `valueFormat` | How figures are written unless a figure sets its own `format`, such as plain numbers, currency, percent, short forms like `12K`, or dates. | `{{components.summarystrip1.valueFormat}}` |
| `currency` | Currency code used for figures formatted as currency, such as `USD` or `EUR`. | `{{components.summarystrip1.currency}}` |
| `locale` | Locale used to format numbers, currency and dates, such as `en-US`. Leave empty to follow the currency. | `{{components.summarystrip1.locale}}` |
| `deltaFormat` | How a numeric change is written unless a figure sets its own `deltaFormat`. | `{{components.summarystrip1.deltaFormat}}` |
| `appearance` | **Panel** groups the figures in one bordered box, **Plain** shows them without a box, and **Cards** puts each figure in its own box. | `{{components.summarystrip1.appearance}}` |
| `size` | Size of the figures and their spacing. | `{{components.summarystrip1.size}}` |
| `align` | Whether each figure's text is aligned left or centered. | `{{components.summarystrip1.align}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton outline. | `{{components.summarystrip1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Panel background | Theme: Surface 1 |
| Border and separator color | Theme: Default border |
| Label and caption color | Theme: Placeholder text |
| Figure color | Theme: Primary text |
| Positive change color | `var(--cc-success-systemStatus)` |
| Negative change color | `var(--cc-error-systemStatus)` |
| Panel radius | — |
| Figure typeface | Theme font |
