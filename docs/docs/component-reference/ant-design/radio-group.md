---
id: radio-group
title: Radio Group
---

<div className="badge badge--primary">Ant Design</div>

The **Radio Group** component is Ant Design's set of radio buttons. Users pick exactly one of a few options that are all visible at once, such as a shipping method or a priority.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the options, or beside them when **Layout** is `horizontal`. | Text. Default: `Shipping` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Options | The choices, as plain values or as `{ label, value, disabled }` objects, such as `[{ label: 'Express', value: 'express' }]`. | Array |
| Value | Value of the option picked at the start. A value that matches no option is cleared once the options load. | Text |
| Option type | `default` shows round radio buttons; `button` shows the options as a row of joined buttons. | `default`, `button`. Default: `default` |
| Button style | Look of the picked button when **Option type** is `button`. `solid` fills it with the primary color; `outline` only colors its border and text. | `outline`, `solid`. Default: `solid` |
| Vertical | Stacks the radio buttons in a column instead of a row. | On or off. Default: Off |
| Size | Size of the options when **Option type** is `button`. | `small`, `middle`, `large`. Default: `middle` |
| Allow deselect | Lets the user clear the choice by clicking the picked option again. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the picked option changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Picks the option with the given **Value**. | `components.radiogroup1.setFieldValue("")` |
| Reset field | Sets the choice back to the **Value** property. | `components.radiogroup1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the options, or beside them when **Layout** is `horizontal`. | `{{components.radiogroup1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.radiogroup1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.radiogroup1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.radiogroup1.layout}}` |
| `options` | The choices, as plain values or as `{ label, value, disabled }` objects, such as `[{ label: 'Express', value: 'express' }]`. | `{{components.radiogroup1.options}}` |
| `value` | Value of the option picked at the start. A value that matches no option is cleared once the options load. | `{{components.radiogroup1.value}}` |
| `optionType` | `default` shows round radio buttons; `button` shows the options as a row of joined buttons. | `{{components.radiogroup1.optionType}}` |
| `buttonStyle` | Look of the picked button when **Option type** is `button`. `solid` fills it with the primary color; `outline` only colors its border and text. | `{{components.radiogroup1.buttonStyle}}` |
| `vertical` | Stacks the radio buttons in a column instead of a row. | `{{components.radiogroup1.vertical}}` |
| `size` | Size of the options when **Option type** is `button`. | `{{components.radiogroup1.size}}` |
| `allowDeselect` | Lets the user clear the choice by clicking the picked option again. | `{{components.radiogroup1.allowDeselect}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
