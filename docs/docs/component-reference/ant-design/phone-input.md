---
id: phone-input
title: Phone Input
---

<div className="badge badge--primary">Ant Design</div>

The **Phone Input** component is a phone number field with a country picker that shows each country's flag and calling code. It stores the number in international E.164 form, such as `+14155550123`.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Phone` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | The phone number the field starts with, in E.164 form such as `+14155550123`. | Text |
| Default country | Two-letter country code, such as `US` or `IN`, picked when the number doesn't name a country. | Text. Default: `US` |
| Only countries | Two-letter codes of the countries the picker offers, such as `['US', 'GB', 'IN']`. Leave it empty to offer every country. | Array |
| Allow country change | Lets the user pick a different country. Turn it off to fix the country. | On or off. Default: On |
| Show flag | Shows the country flag next to the calling code. | On or off. Default: On |
| Placeholder | Hint text shown while the field is empty. | Text. Default: `Enter a phone number` |
| Allow clear | Shows a clear icon in the field once it has a number. | On or off. Default: Off |
| Variant | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the number or the country changes. |
| [On press enter](../common-settings.md#events) | Triggers when the user presses Enter in the field. |
| [On focus](../common-settings.md#events) | Triggers when the number field gets keyboard focus. |
| [On blur](../common-settings.md#events) | Triggers when the number field loses keyboard focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the phone number to the given **Number**. A number that starts with a calling code also picks that country. | `components.phoneinput1.setFieldValue("")` |
| Set country | Picks the country with the given **Country (ISO code)**, such as `GB`. A country outside **Only countries** is ignored. | `components.phoneinput1.setCountryCode("")` |
| Reset field | Sets the field back to the **Value** property. | `components.phoneinput1.resetFields()` |
| Focus | Moves keyboard focus to the number field. | `components.phoneinput1.focus()` |
| Blur | Removes keyboard focus from the number field. | `components.phoneinput1.blur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.phoneinput1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.phoneinput1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.phoneinput1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.phoneinput1.layout}}` |
| `value` | The phone number the field starts with, in E.164 form such as `+14155550123`. | `{{components.phoneinput1.value}}` |
| `defaultCountry` | Two-letter country code, such as `US` or `IN`, picked when the number doesn't name a country. | `{{components.phoneinput1.defaultCountry}}` |
| `onlyCountries` | Two-letter codes of the countries the picker offers, such as `['US', 'GB', 'IN']`. Leave it empty to offer every country. | `{{components.phoneinput1.onlyCountries}}` |
| `allowCountryChange` | Lets the user pick a different country. Turn it off to fix the country. | `{{components.phoneinput1.allowCountryChange}}` |
| `showFlag` | Shows the country flag next to the calling code. | `{{components.phoneinput1.showFlag}}` |
| `placeholder` | Hint text shown while the field is empty. | `{{components.phoneinput1.placeholder}}` |
| `allowClear` | Shows a clear icon in the field once it has a number. | `{{components.phoneinput1.allowClear}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.phoneinput1.variant}}` |
| `size` | Height and text size of the field. | `{{components.phoneinput1.size}}` |
| `country` | Two-letter code of the picked country, such as `US`. | `{{components.phoneinput1.country}}` |
| `countryCode` | Calling code of the picked country, such as `+1`. | `{{components.phoneinput1.countryCode}}` |
| `formattedValue` | The number with its calling code and digit groups, as the user reads it. | `{{components.phoneinput1.formattedValue}}` |
| `isValidNumber` | `true` when the number has a valid length for the picked country. | `{{components.phoneinput1.isValidNumber}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
