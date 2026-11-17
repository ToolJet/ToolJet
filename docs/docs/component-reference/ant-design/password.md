---
id: password
title: Password
---

<div className="badge badge--primary">Ant Design</div>

The **Password** component is Ant Design's password input. It hides what the user types, with an optional show and hide toggle and a strength meter.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Password` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | The password the field starts with. | Text |
| Placeholder | Hint text shown while the field is empty. | Text. Default: `Enter your password` |
| Visibility toggle | Shows an eye icon that reveals or hides the password. | On or off. Default: On |
| Show strength | Shows a four-step meter under the field that rates the password as Weak, Fair, Good or Strong. | On or off. Default: Off |
| Min length | Fewest characters the password needs. A shorter password is not valid. `0` sets no minimum. | Number. Default: `0` |
| Allow clear | Shows a clear icon in the field once it has text. | On or off. Default: Off |
| Variant | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the password changes. |
| [On press enter](../common-settings.md#events) | Triggers when the user presses Enter in the field. |
| [On focus](../common-settings.md#events) | Triggers when the field gets keyboard focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses keyboard focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the password to the given **Value**. | `components.password1.setFieldValue("")` |
| Clear | Sets the field back to the **Value** property, which empties it when **Value** is empty. | `components.password1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.password1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.password1.blur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.password1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.password1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.password1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.password1.layout}}` |
| `value` | The password the field starts with. | `{{components.password1.value}}` |
| `placeholder` | Hint text shown while the field is empty. | `{{components.password1.placeholder}}` |
| `visibilityToggle` | Shows an eye icon that reveals or hides the password. | `{{components.password1.visibilityToggle}}` |
| `showStrength` | Shows a four-step meter under the field that rates the password as Weak, Fair, Good or Strong. | `{{components.password1.showStrength}}` |
| `minLength` | Fewest characters the password needs. A shorter password is not valid. `0` sets no minimum. | `{{components.password1.minLength}}` |
| `allowClear` | Shows a clear icon in the field once it has text. | `{{components.password1.allowClear}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.password1.variant}}` |
| `size` | Height and text size of the field. | `{{components.password1.size}}` |
| `strength` | Rating of the password: `Weak`, `Fair`, `Good` or `Strong`, or empty when the field is empty. Length, mixed case, digits and symbols raise it. | `{{components.password1.strength}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
