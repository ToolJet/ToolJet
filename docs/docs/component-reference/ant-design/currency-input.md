---
id: currency-input
title: Currency Input
---

<div className="badge badge--primary">Ant Design</div>

The **Currency Input** component is a field for entering an amount of money, shown with the currency symbol and the right separators, such as a price or an invoice total.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Amount` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Amount in the field when the app loads, as a number. **Reset field** returns to this value. | Number |
| Currency | Currency code of the amount, such as `USD`, `EUR` or `INR`. | Text. Default: `USD` |
| Currency options | Currency codes the user can pick from, such as `['USD', 'EUR', 'INR']`, shown in a dropdown before the field. Leave it empty for one fixed currency. | Array |
| Locale | Locale for the separators and symbol, such as `de-DE` for `1.234,50 €`. Leave it empty to use the browser's locale. | Text |
| Precision | Number of decimal places, from 0 to 6. The amount is rounded to it. | Number. Default: `2` |
| Currency display | How the currency shows. `symbol` is the local symbol, such as `US$` or `$`, `narrowSymbol` is the shortest symbol, such as `$`, and `code` is the code, such as `USD`. | `symbol`, `narrowSymbol`, `code`. Default: `symbol` |
| Min | Lowest amount allowed. A smaller amount shows a validation error. | Number |
| Max | Highest amount allowed. A larger amount shows a validation error. | Number |
| Placeholder | Hint shown in the field while it is empty. | Text. Default: `0.00` |
| Variant | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

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
| On change | Triggers when the amount changes, by typing or an action. |
| On press enter | Triggers when the user presses Enter in the field. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Changes the amount to the given **Value** and fires **On change**. | `components.currencyinput1.setFieldValue("")` |
| Set currency | Changes the currency to the given **Currency code**, such as `EUR`. | `components.currencyinput1.setCurrency("")` |
| Reset field | Returns the amount to the **Value** property's value. | `components.currencyinput1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.currencyinput1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.currencyinput1.blur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.currencyinput1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.currencyinput1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.currencyinput1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.currencyinput1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.currencyinput1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.currencyinput1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.currencyinput1.layout}}` |
| `value` | Amount in the field when the app loads, as a number. **Reset field** returns to this value. | `{{components.currencyinput1.value}}` |
| `currency` | Currency code of the amount, such as `USD`, `EUR` or `INR`. | `{{components.currencyinput1.currency}}` |
| `currencyOptions` | Currency codes the user can pick from, such as `['USD', 'EUR', 'INR']`, shown in a dropdown before the field. Leave it empty for one fixed currency. | `{{components.currencyinput1.currencyOptions}}` |
| `locale` | Locale for the separators and symbol, such as `de-DE` for `1.234,50 €`. Leave it empty to use the browser's locale. | `{{components.currencyinput1.locale}}` |
| `precision` | Number of decimal places, from 0 to 6. The amount is rounded to it. | `{{components.currencyinput1.precision}}` |
| `currencyDisplay` | How the currency shows. `symbol` is the local symbol, such as `US$` or `$`, `narrowSymbol` is the shortest symbol, such as `$`, and `code` is the code, such as `USD`. | `{{components.currencyinput1.currencyDisplay}}` |
| `min` | Lowest amount allowed. A smaller amount shows a validation error. | `{{components.currencyinput1.min}}` |
| `max` | Highest amount allowed. A larger amount shows a validation error. | `{{components.currencyinput1.max}}` |
| `placeholder` | Hint shown in the field while it is empty. | `{{components.currencyinput1.placeholder}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.currencyinput1.variant}}` |
| `size` | Height and text size of the field. | `{{components.currencyinput1.size}}` |
| `formattedValue` | The amount as text with its currency and separators, such as `$1,234.50`. | `{{components.currencyinput1.formattedValue}}` |
| `isVisible` | Whether the component is visible. | `{{components.currencyinput1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.currencyinput1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.currencyinput1.isDisabled}}` |

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
