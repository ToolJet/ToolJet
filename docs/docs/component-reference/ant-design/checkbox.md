---
id: checkbox
title: Checkbox
---

<div className="badge badge--primary">Ant Design</div>

The **Checkbox** component lets users turn a single option on or off, such as accepting terms or marking a task done.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown next to the checkbox. | Text. Default: `Checkbox` |
| Checked | Whether the box starts checked. **Reset field** returns to this value. | On or off. Default: Off |
| Indeterminate | Shows a dash in the box while it is unchecked, to mean a partial selection, such as when only some items in a group are checked. | On or off. Default: Off |
| Extra | Help text shown under the checkbox. A validation message replaces it while the value is invalid. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the checkbox is checked or unchecked, by the user or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set checked | Checks or unchecks the box, as set by **Checked**. | `components.checkbox1.setFieldValue("")` |
| Reset field | Returns the box to the **Checked** property's value. | `components.checkbox1.resetFields()` |
| Toggle | Switches the box between checked and unchecked. | `components.checkbox1.toggle()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown next to the checkbox. | `{{components.checkbox1.children}}` |
| `checked` | Whether the box starts checked. **Reset field** returns to this value. | `{{components.checkbox1.checked}}` |
| `indeterminate` | Shows a dash in the box while it is unchecked, to mean a partial selection, such as when only some items in a group are checked. | `{{components.checkbox1.indeterminate}}` |
| `extra` | Help text shown under the checkbox. A validation message replaces it while the value is invalid. | `{{components.checkbox1.extra}}` |
| `value` | `true` when the box is checked, `false` when not. | `{{components.checkbox1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
