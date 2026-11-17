---
id: progress-list
title: Progress List
---

<div className="badge badge--primary">Ant Design</div>

The **Progress List** component shows rows of labeled progress bars, such as budget used per team or progress toward each sales target.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Data source | Rows to show, one bar each, such as the data from a query. | Array |
| Label field | Field shown as each bar's label. | Text. Default: `label` |
| Value field | Field with each row's value. Without a target, a plain number is read as the percent, or as a share of the largest value when **Value format** is `number`, `currency` or `compact`. | Text. Default: `value` |
| Target field | Field with each row's target. The bar shows value divided by target. | Text |
| Percent field | Field with the bar's fill as a fraction, such as `0.75` for 75%. It takes priority over value and target. | Text |
| Caption field | Field shown as small text under the bar. | Text |
| Status field | Field whose words color the bar, such as On track for green, At risk for amber and Over budget for red. | Text |
| Value format | How values and targets are written. `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `auto`, `number`, `currency`, `percent`, `compact`. Default: `auto` |
| Currency | Currency code, such as `USD` or `EUR`, used when **Value format** is `currency`. | Text. Default: `USD` |
| Locale | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | Text |
| Id field | Field that identifies each row. It's read into **selectedItemId**. | Text. Default: `id` |
| Auto tone | Colors bars by their percent. `goal` turns a bar green at 100%; `limit` turns it amber from 80% and red over 100%. | `none`, `goal`, `limit`. Default: `none` |
| Show values | Shows each row's value, and its target when set, above the bar. | On or off. Default: On |
| Show percent | Shows each row's percent above the bar. | On or off. Default: On |
| Size | Thickness of the bars. | `small`, `default`, `large`. Default: `default` |
| Bordered | Draws a border around the list. | On or off. Default: Off |
| Empty text | Text shown when there are no rows. | Text. Default: `No data` |

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
| On item clicked | Triggers when the user clicks a row to select it. Clicking the selected row again clears the selection without triggering the event. |

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
| `dataSource` | Rows to show, one bar each, such as the data from a query. | `{{components.progresslist1.dataSource}}` |
| `labelField` | Field shown as each bar's label. | `{{components.progresslist1.labelField}}` |
| `valueField` | Field with each row's value. Without a target, a plain number is read as the percent, or as a share of the largest value when **Value format** is `number`, `currency` or `compact`. | `{{components.progresslist1.valueField}}` |
| `targetField` | Field with each row's target. The bar shows value divided by target. | `{{components.progresslist1.targetField}}` |
| `percentField` | Field with the bar's fill as a fraction, such as `0.75` for 75%. It takes priority over value and target. | `{{components.progresslist1.percentField}}` |
| `captionField` | Field shown as small text under the bar. | `{{components.progresslist1.captionField}}` |
| `statusField` | Field whose words color the bar, such as On track for green, At risk for amber and Over budget for red. | `{{components.progresslist1.statusField}}` |
| `valueFormat` | How values and targets are written. `percent` reads 0.25 as 25%, and `compact` shortens large numbers to 12K or 1.2M. | `{{components.progresslist1.valueFormat}}` |
| `currency` | Currency code, such as `USD` or `EUR`, used when **Value format** is `currency`. | `{{components.progresslist1.currency}}` |
| `locale` | Locale for number formatting, such as `pt-BR`. Leave it empty to follow the currency's usual format. | `{{components.progresslist1.locale}}` |
| `idField` | Field that identifies each row. It's read into **selectedItemId**. | `{{components.progresslist1.idField}}` |
| `autoTone` | Colors bars by their percent. `goal` turns a bar green at 100%; `limit` turns it amber from 80% and red over 100%. | `{{components.progresslist1.autoTone}}` |
| `showValues` | Shows each row's value, and its target when set, above the bar. | `{{components.progresslist1.showValues}}` |
| `showPercent` | Shows each row's percent above the bar. | `{{components.progresslist1.showPercent}}` |
| `size` | Thickness of the bars. | `{{components.progresslist1.size}}` |
| `bordered` | Draws a border around the list. | `{{components.progresslist1.bordered}}` |
| `emptyText` | Text shown when there are no rows. | `{{components.progresslist1.emptyText}}` |
| `selectedItemId` | Value of **Id field** in the item the user clicked, or empty when nothing is selected. | `{{components.progresslist1.selectedItemId}}` |
| `selectedItem` | The full data row of the item the user clicked, or `{}` when nothing is selected. | `{{components.progresslist1.selectedItem}}` |
| `selectedItemIndex` | Position of the clicked item in **Data source**, counting from 0, or `-1` when nothing is selected. | `{{components.progresslist1.selectedItemIndex}}` |
| `isVisible` | Whether the component is visible. | `{{components.progresslist1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.progresslist1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.progresslist1.isDisabled}}` |

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
