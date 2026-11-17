---
id: phone-input
title: Phone Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Phone Input** component is a field for entering a phone number with its country, such as a customer's contact number. It formats the number as the user types and checks that it is valid for the chosen country.

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
| On change | Triggers when the number or the country changes. |
| On enter pressed | Triggers when the user presses Enter in the field. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the number to the given **Value**, in **Country** when one is given. | `components.phoneinput1.setValue("", "")` |
| Set country code | Switches to the given **Country code**, either a two-letter code such as `GB` or a calling code such as `+44`, keeping the digits typed. | `components.phoneinput1.setCountryCode("")` |
| Clear | Empties the number. | `components.phoneinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.phoneinput1.setFocus()` |
| Set blur | Removes focus from the field. | `components.phoneinput1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.phoneinput1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.phoneinput1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.phoneinput1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.phoneinput1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.phoneinput1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.phoneinput1.isDisabled}}` |

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
| Error color (message and border) | Theme: Error |
| Field radius | — |
| Country button background | `transparent` |
| Country button text color | Theme: Primary text |
| Popover background | Theme: Surface 1 |
| Popover text color | Theme: Primary text |
| Popover item hover background | Theme: Surface 3 |
| Selected item text color (on the accent) | Theme: Surface 1 |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
