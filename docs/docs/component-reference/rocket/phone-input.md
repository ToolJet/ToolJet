---
id: phone-input
title: Phone Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Phone Input** component is a field for entering a phone number with its country, such as a customer's contact number. It formats the number as the user types and checks that it is valid for the chosen country.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Phone number` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when it is empty. | Text. Default: `Enter phone number` |
| Default value (E.164 or a national number) | Number filled in when the app loads, such as `+14155550123` or a local number in **Default country**. A number with a `+` country code picks its own country. | Text |
| Default country (ISO code) | Two-letter country code selected when the app loads, such as `US` or `GB`. | Text. Default: `US` |
| Countries offered (ISO codes; empty: all) | Country codes to offer in the country list, such as `['US', 'CA', 'GB']`. Leave empty to offer every country. | Array |
| Enable country change | Lets the user pick another country from a searchable list. When off, the country stays fixed. | On or off. Default: On |
| Show country flag | Shows the country's flag next to its calling code. | On or off. Default: On |
| Show clear button | Shows a button in the field that clears the number. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the number or the country changes. |
| [On enter pressed](../common-settings.md#events) | Triggers when the user presses Enter in the field. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the number to the given **Value**, in **Country** when one is given. | `components.phoneinput1.setValue("", "")` |
| Set country code | Switches to the given **Country code**, either a two-letter code such as `GB` or a calling code such as `+44`, keeping the digits typed. | `components.phoneinput1.setCountryCode("")` |
| Clear | Empties the number. | `components.phoneinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.phoneinput1.setFocus()` |
| Set blur | Removes focus from the field. | `components.phoneinput1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.phoneinput1.label}}` |
| `description` | Hint text shown under the field. | `{{components.phoneinput1.description}}` |
| `placeholder` | Text shown in the field when it is empty. | `{{components.phoneinput1.placeholder}}` |
| `defaultValue` | Number filled in when the app loads, such as `+14155550123` or a local number in **Default country**. A number with a `+` country code picks its own country. | `{{components.phoneinput1.defaultValue}}` |
| `defaultCountry` | Two-letter country code selected when the app loads, such as `US` or `GB`. | `{{components.phoneinput1.defaultCountry}}` |
| `onlyCountries` | Country codes to offer in the country list, such as `['US', 'CA', 'GB']`. Leave empty to offer every country. | `{{components.phoneinput1.onlyCountries}}` |
| `isCountryChangeEnabled` | Lets the user pick another country from a searchable list. When off, the country stays fixed. | `{{components.phoneinput1.isCountryChangeEnabled}}` |
| `showFlag` | Shows the country's flag next to its calling code. | `{{components.phoneinput1.showFlag}}` |
| `showClearBtn` | Shows a button in the field that clears the number. | `{{components.phoneinput1.showClearBtn}}` |
| `value` | The full number in international format, such as `+14155550123`. | `{{components.phoneinput1.value}}` |
| `country` | The two-letter code of the selected country, such as `US`. | `{{components.phoneinput1.country}}` |
| `countryCode` | The calling code of the selected country, such as `+1`. | `{{components.phoneinput1.countryCode}}` |
| `formattedValue` | The number formatted for display. | `{{components.phoneinput1.formattedValue}}` |
| `isValidNumber` | Whether the number is valid for the selected country. | `{{components.phoneinput1.isValidNumber}}` |

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
| Country button background | `transparent` |
| Country button text color | Theme: Primary text |
| Popover background | Theme: Surface 1 |
| Popover text color | Theme: Primary text |
| Popover item hover background | Theme: Surface 3 |
| Selected item text color (on the accent) | Theme: Surface 1 |
