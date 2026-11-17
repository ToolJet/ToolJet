---
id: checkbox
title: Checkbox
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Checkbox** component lets the user turn a single option on or off, such as agreeing to terms or marking a task as done. When it is mandatory, the user must check it.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown next to the checkbox. | Text. Default: `Checkbox` |
| Help text | Help text shown under the label. | Text |
| Checked by default | Whether the checkbox starts checked. Changing it resets the checkbox to this state. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the checkbox is checked or unchecked. |
| [On check](../common-settings.md#events) | Triggers when the checkbox becomes checked. |
| [On un check](../common-settings.md#events) | Triggers when the checkbox becomes unchecked. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Toggle | Switches the checkbox between checked and unchecked. | `components.checkbox1.toggle()` |
| Set value | Checks or unchecks the checkbox, based on **Value**. | `components.checkbox1.setValue(true)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown next to the checkbox. | `{{components.checkbox1.label}}` |
| `description` | Help text shown under the label. | `{{components.checkbox1.description}}` |
| `defaultChecked` | Whether the checkbox starts checked. Changing it resets the checkbox to this state. | `{{components.checkbox1.defaultChecked}}` |
| `value` | `true` when the checkbox is checked, `false` when it is not. | `{{components.checkbox1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Checked color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Unchecked box border color | Theme: Brand primary |
| Error color | `var(--cc-error-systemStatus)` |
| Label color (earlier name) | — |
