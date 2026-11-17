---
id: textarea
title: Textarea
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Textarea** component is a multi-line text field for longer input, such as notes, comments or a description.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Label` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when it is empty. | Text. Default: `Enter text` |
| Default value | Text in the field when the app loads. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |
| [On change](../common-settings.md#events) | Triggers when the text in the field changes. |
| [On enter pressed](../common-settings.md#events) | Triggers when the user presses Enter without Shift. The new line is still added. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field to the given **Text**. | `components.textarea1.setText("")` |
| Clear | Empties the field. | `components.textarea1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.textarea1.setFocus()` |
| Set blur | Removes focus from the field. | `components.textarea1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.textarea1.label}}` |
| `description` | Hint text shown under the field. | `{{components.textarea1.description}}` |
| `placeholder` | Text shown in the field when it is empty. | `{{components.textarea1.placeholder}}` |
| `defaultValue` | Text in the field when the app loads. | `{{components.textarea1.defaultValue}}` |
| `value` | The text in the field. | `{{components.textarea1.value}}` |

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
