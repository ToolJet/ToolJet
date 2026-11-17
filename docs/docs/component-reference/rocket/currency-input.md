---
id: currency-input
title: Currency Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Currency Input** component lets the user enter an amount of money, shown with the currency sign and formatted for the locale. The user can also pick the currency when you give a list to choose from.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Amount` |
| Help text | Help text shown under the field. | Text |
| Placeholder | Hint text shown when the field is empty. | Text. Default: `0.00` |
| Default value | The amount the field starts with. Changing it resets the field to this amount. | Text |
| Currency (ISO code) | The currency of the amount, as an ISO code such as `USD`, `EUR` or `INR`. | Text. Default: `USD` |
| Currencies to choose from (empty: fixed) | Currency codes the user can pick from, such as `['USD', 'EUR', 'GBP']`. Leave empty to keep one fixed currency. | Array |
| Number format locale | The locale used to format the number, such as `en-US`, `de-DE` or `en-IN`. | Text. Default: `en-US` |
| Decimal places (empty: the currency's own) | How many decimal places the amount has. Leave empty to use the currency's usual number, such as `2` for `USD`. | Text |
| Currency sign | How the currency is shown next to the amount: **Symbol** such as `CA$`, **Narrow** such as `$`, or **Code** such as `CAD`. | Symbol, Narrow, Code. Default: Symbol |
| Show clear button | Shows a button that clears the amount. | On or off. Default: Off |
| Min value | The smallest amount allowed. A lower amount shows a validation error. | Text |
| Max value | The largest amount allowed. A higher amount shows a validation error. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the amount or the currency changes. |
| [On enter pressed](../common-settings.md#events) | Triggers when the user presses Enter in the field. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the amount to **Value**, and the currency to **Currency** when it is given. | `components.currencyinput1.setValue("", "")` |
| Set currency | Changes the currency to **Currency** and rounds the amount to that currency's decimal places. | `components.currencyinput1.setCurrency("")` |
| Clear | Clears the amount. | `components.currencyinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.currencyinput1.setFocus()` |
| Set blur | Removes keyboard focus from the field. | `components.currencyinput1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.currencyinput1.label}}` |
| `description` | Help text shown under the field. | `{{components.currencyinput1.description}}` |
| `placeholder` | Hint text shown when the field is empty. | `{{components.currencyinput1.placeholder}}` |
| `defaultValue` | The amount the field starts with. Changing it resets the field to this amount. | `{{components.currencyinput1.defaultValue}}` |
| `currency` | The currency of the amount, as an ISO code such as `USD`, `EUR` or `INR`. | `{{components.currencyinput1.currency}}` |
| `currencyOptions` | Currency codes the user can pick from, such as `['USD', 'EUR', 'GBP']`. Leave empty to keep one fixed currency. | `{{components.currencyinput1.currencyOptions}}` |
| `locale` | The locale used to format the number, such as `en-US`, `de-DE` or `en-IN`. | `{{components.currencyinput1.locale}}` |
| `decimalPlaces` | How many decimal places the amount has. Leave empty to use the currency's usual number, such as `2` for `USD`. | `{{components.currencyinput1.decimalPlaces}}` |
| `currencyDisplay` | How the currency is shown next to the amount: **Symbol** such as `CA$`, **Narrow** such as `$`, or **Code** such as `CAD`. | `{{components.currencyinput1.currencyDisplay}}` |
| `showClearBtn` | Shows a button that clears the amount. | `{{components.currencyinput1.showClearBtn}}` |
| `minValue` | The smallest amount allowed. A lower amount shows a validation error. | `{{components.currencyinput1.minValue}}` |
| `maxValue` | The largest amount allowed. A higher amount shows a validation error. | `{{components.currencyinput1.maxValue}}` |
| `value` | The amount as a number, or `null` when the field is empty. | `{{components.currencyinput1.value}}` |
| `formattedValue` | The amount formatted with its currency sign, such as `$1,234.50`. | `{{components.currencyinput1.formattedValue}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Field background | Theme: Surface 1 |
| Field text color | Theme: Primary text |
| Placeholder color | Theme: Placeholder text |
| Field border color | Theme: Default border |
| Accent (focus ring, selection) | Theme: Brand primary |
| Error color (message and border) | `var(--cc-error-systemStatus)` |
| Field radius | — |
| Currency sign color | Theme: Placeholder text |
| Currency picker background | `transparent` |
| Currency picker text color | Theme: Primary text |
| Popover background | Theme: Surface 1 |
| Popover text color | Theme: Primary text |
| Popover item hover background | Theme: Surface 3 |
| Selected item text color (on the accent) | Theme: Surface 1 |
