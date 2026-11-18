---
id: progress-list
title: Progress List
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Progress List** component shows a list of items, each with a progress bar toward a target, such as budgets, sales quotas or project goals. Each row can add a status chip and a caption.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data | Rows to list, one bar per row. | Array |
| Label field | Field shown as the name of each row. | Text. Default: `label` |
| Value field | Field with the current amount, such as money spent. | Text. Default: `spent` |
| Target field | Field with the amount to reach, such as the budget. The bar fills to the value as a share of the target. | Text. Default: `budget` |
| Percent field (0 to 100; overrides value / target) | Field with a ready-made percent from `0` to `100`. When set, it fills the bar instead of **Value field** and **Target field**. | Text |
| Caption field (a line under the bar) | Field shown as a small line of text under the bar. | Text. Default: `note` |
| Status field (a chip, or a tone name) | Field shown as a colored chip next to the label. A tone name such as `success` or `danger` colors the bar without a chip. | Text. Default: `status` |
| Value format | How the value and target are written, such as plain numbers, currency, percent or short forms like `12K`. | Auto, Number, Currency, Percent, Compact. Default: Number |
| Currency (ISO code, e.g. USD) | Currency code used when **Value format** is **Currency**, such as `USD` or `EUR`. | Text. Default: `USD` |
| Locale | Locale used to format numbers and currency, such as `en-US`. Leave empty to follow the currency. | Text |
| Id field | Field that identifies each row. It fills **selectedItemId** when the user clicks a row. | Text. Default: `id` |
| Tone from progress | Colors bars by their percent when the row has no status. **Goal** turns a bar green at 100%; **Limit** turns it amber from 80% and red past 100%. | None, Goal, Limit. Default: None |
| Show value of target | Shows the value and the target as text, such as `18,400 of 25,000`. | On or off. Default: On |
| Show percentage | Shows each row's percent as a number. | On or off. Default: On |
| Bar size | Thickness of the bars. | Thin, Default, Thick. Default: Default |
| List style | **Card** draws the list in a bordered box; **Plain** shows the rows without one. | Card, Plain. Default: Card |
| Empty text | Message shown when there are no rows. | Text. Default: `Nothing to track yet` |
| Loading look | What shows while the list is loading: a spinner or skeleton rows. | Spinner, Skeleton. Default: Spinner |

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

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On item clicked | Triggers when the user clicks a row. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear selection | Clears the selected row. | `components.progresslist1.clearSelection()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.progresslist1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.progresslist1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.progresslist1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `data` | Rows to list, one bar per row. | `{{components.progresslist1.data}}` |
| `labelField` | Field shown as the name of each row. | `{{components.progresslist1.labelField}}` |
| `valueField` | Field with the current amount, such as money spent. | `{{components.progresslist1.valueField}}` |
| `targetField` | Field with the amount to reach, such as the budget. The bar fills to the value as a share of the target. | `{{components.progresslist1.targetField}}` |
| `percentField` | Field with a ready-made percent from `0` to `100`. When set, it fills the bar instead of **Value field** and **Target field**. | `{{components.progresslist1.percentField}}` |
| `captionField` | Field shown as a small line of text under the bar. | `{{components.progresslist1.captionField}}` |
| `statusField` | Field shown as a colored chip next to the label. A tone name such as `success` or `danger` colors the bar without a chip. | `{{components.progresslist1.statusField}}` |
| `valueFormat` | How the value and target are written, such as plain numbers, currency, percent or short forms like `12K`. | `{{components.progresslist1.valueFormat}}` |
| `currency` | Currency code used when **Value format** is **Currency**, such as `USD` or `EUR`. | `{{components.progresslist1.currency}}` |
| `locale` | Locale used to format numbers and currency, such as `en-US`. Leave empty to follow the currency. | `{{components.progresslist1.locale}}` |
| `idField` | Field that identifies each row. It fills **selectedItemId** when the user clicks a row. | `{{components.progresslist1.idField}}` |
| `autoTone` | Colors bars by their percent when the row has no status. **Goal** turns a bar green at 100%; **Limit** turns it amber from 80% and red past 100%. | `{{components.progresslist1.autoTone}}` |
| `showValues` | Shows the value and the target as text, such as `18,400 of 25,000`. | `{{components.progresslist1.showValues}}` |
| `showPercent` | Shows each row's percent as a number. | `{{components.progresslist1.showPercent}}` |
| `barSize` | Thickness of the bars. | `{{components.progresslist1.barSize}}` |
| `listStyle` | **Card** draws the list in a bordered box; **Plain** shows the rows without one. | `{{components.progresslist1.listStyle}}` |
| `emptyText` | Message shown when there are no rows. | `{{components.progresslist1.emptyText}}` |
| `loadingIndicator` | What shows while the list is loading: a spinner or skeleton rows. | `{{components.progresslist1.loadingIndicator}}` |
| `selectedItem` | The data row the user clicked last. | `{{components.progresslist1.selectedItem}}` |
| `selectedItemId` | The id of the clicked row, from **Id field**. | `{{components.progresslist1.selectedItemId}}` |
| `selectedItemIndex` | The position of the clicked row in the data, starting at `0`, or `-1` when none is selected. | `{{components.progresslist1.selectedItemIndex}}` |
| `isVisible` | Whether the component is visible. | `{{components.progresslist1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.progresslist1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.progresslist1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| List background | Theme: Surface 1 |
| Border and divider color | Theme: Default border |
| Label and value color | Theme: Primary text |
| Caption color | Theme: Placeholder text |
| Bar color (rows without a tone) | Theme: Brand primary |
| Bar track color | Theme: Primary text |
| List radius | — |
| Label typeface | Theme font |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
