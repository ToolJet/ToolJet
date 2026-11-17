---
id: password-input
title: Password Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Password Input** component is a text field that hides what the user types, for entering a password, an API key or another secret. It can show a meter that rates how strong the password is.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Password` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when it is empty. | Text. Default: `Enter password` |
| Default value | Text in the field when the app loads. | Text |
| Show/hide button | Shows an eye button in the field that reveals or hides the password. | On or off. Default: On |
| Strength meter | Shows a meter under the field that rates the password as **Weak**, **Fair** or **Strong**, based on its length and mix of lowercase, uppercase, digits and symbols. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the text in the field changes. |
| [On enter pressed](../common-settings.md#events) | Triggers when the user presses Enter in the field. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field to the given **Value**. | `components.passwordinput1.setText("")` |
| Clear | Empties the field. | `components.passwordinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.passwordinput1.setFocus()` |
| Set blur | Removes focus from the field. | `components.passwordinput1.setBlur()` |

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
| Eye icon color | Theme: Placeholder text |
| Strength color: weak | `var(--cc-error-systemStatus)` |
| Strength color: fair | `var(--cc-warning-systemStatus)` |
| Strength color: strong | `var(--cc-success-systemStatus)` |
| Strength meter track color | Theme: Surface 3 |
