---
id: input
title: Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Input** component is a single-line text field with a label, for entering names, emails, numbers, passwords or search terms. **Email** and **URL** types check the format of what the user types.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Label shown above the field. | Text. Default: `Label` |
| Help text | Help text shown under the field. | Text |
| Placeholder | Hint text shown while the field is empty. | Text. Default: `Enter text` |
| Default value | Text the field starts with. Changing it replaces the current value. | Text |
| Type | Kind of value the field takes. **Email** and **URL** show an error for a badly formed value, **Number** gives a number, **Password** hides the text, and **Search** adds a clear button and clears on `Escape`. | Text, Email, URL, Number, Password, Search, Phone. Default: Text |
| Show clear button | Shows a button that empties the field while it has text. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On focus](../common-settings.md#events) | Triggers when the field gains focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |
| [On change](../common-settings.md#events) | Triggers when the field's value changes. |
| [On enter pressed](../common-settings.md#events) | Triggers when the user presses `Enter` in the field. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field's value to **Text**. | `components.input1.setText("")` |
| Clear | Empties the field. | `components.input1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.input1.setFocus()` |
| Set blur | Removes keyboard focus from the field. | `components.input1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Label shown above the field. | `{{components.input1.label}}` |
| `description` | Help text shown under the field. | `{{components.input1.description}}` |
| `placeholder` | Hint text shown while the field is empty. | `{{components.input1.placeholder}}` |
| `defaultValue` | Text the field starts with. Changing it replaces the current value. | `{{components.input1.defaultValue}}` |
| `inputType` | Kind of value the field takes. **Email** and **URL** show an error for a badly formed value, **Number** gives a number, **Password** hides the text, and **Search** adds a clear button and clears on `Escape`. | `{{components.input1.inputType}}` |
| `showClearBtn` | Shows a button that empties the field while it has text. | `{{components.input1.showClearBtn}}` |
| `value` | Current value of the field. With **Type** set to **Number**, it is a number, or `null` when empty. | `{{components.input1.value}}` |

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
