---
id: password-input
title: Password Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Password Input** component is a text field that hides what the user types, for entering a password, an API key or another secret. It can show a meter that rates how strong the password is.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Password` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when it is empty. | Text. Default: `Enter password` |
| Default value | Text in the field when the app loads. | Text |
| Show/hide button | Shows an eye button in the field that reveals or hides the password. | On or off. Default: On |
| Strength meter | Shows a meter under the field that rates the password as **Weak**, **Fair** or **Strong**, based on its length and mix of lowercase, uppercase, digits and symbols. | On or off. Default: Off |

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
| On change | Triggers when the text in the field changes. |
| On enter pressed | Triggers when the user presses Enter in the field. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field to the given **Value**. | `components.passwordinput1.setText("")` |
| Clear | Empties the field. | `components.passwordinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.passwordinput1.setFocus()` |
| Set blur | Removes focus from the field. | `components.passwordinput1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.passwordinput1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.passwordinput1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.passwordinput1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.passwordinput1.label}}` |
| `description` | Hint text shown under the field. | `{{components.passwordinput1.description}}` |
| `placeholder` | Text shown in the field when it is empty. | `{{components.passwordinput1.placeholder}}` |
| `defaultValue` | Text in the field when the app loads. | `{{components.passwordinput1.defaultValue}}` |
| `showToggle` | Shows an eye button in the field that reveals or hides the password. | `{{components.passwordinput1.showToggle}}` |
| `showStrength` | Shows a meter under the field that rates the password as **Weak**, **Fair** or **Strong**, based on its length and mix of lowercase, uppercase, digits and symbols. | `{{components.passwordinput1.showStrength}}` |
| `value` | The text in the field. | `{{components.passwordinput1.value}}` |
| `strength` | How strong the password is: `weak`, `fair` or `strong`, or empty when the field is empty. | `{{components.passwordinput1.strength}}` |
| `isVisible` | Whether the component is visible. | `{{components.passwordinput1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.passwordinput1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.passwordinput1.isDisabled}}` |

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
| Eye icon color | Theme: Placeholder text |
| Strength color: weak | Theme: Error |
| Strength color: fair | Theme: Warning |
| Strength color: strong | Theme: Success |
| Strength meter track color | Theme: Surface 3 |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
