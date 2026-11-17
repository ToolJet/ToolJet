---
id: summary-strip
title: Summary Strip
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Summary Strip** component shows a row of headline figures side by side, each with a label and an optional change, such as revenue, orders and refund rate at the top of a dashboard.

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
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.summarystrip1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.summarystrip1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.summarystrip1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.summarystrip1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.summarystrip1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.summarystrip1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Panel background | Theme: Surface 1 |
| Border and separator color | Theme: Default border |
| Label and caption color | Theme: Placeholder text |
| Figure color | Theme: Primary text |
| Positive change color | Theme: Success |
| Negative change color | Theme: Error |
| Panel radius | — |
| Figure typeface | Theme font |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
