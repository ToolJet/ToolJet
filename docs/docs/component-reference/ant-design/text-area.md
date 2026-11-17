---
id: text-area
title: Text Area
---

<div className="badge badge--primary">Ant Design</div>

The **Text Area** component is Ant Design's multi-line text input, for notes, comments and descriptions. It grows with its text between a minimum and a maximum number of rows.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Description` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | The text the field starts with. | Text |
| Placeholder | Hint text shown while the field is empty. | Text. Default: `Enter a description` |
| Min rows | Height of the field in rows when it's empty or short. | Number. Default: `3` |
| Max rows | Number of rows the field grows to before it scrolls. `0` lets it grow without a limit. | Number. Default: `8` |
| Allow clear | Shows a clear icon in the field once it has text. | On or off. Default: Off |
| Max length | Most characters the user can type. `0` sets no limit. | Number. Default: `0` |
| Show count | Shows the number of characters typed, and the limit when **Max length** is set. | On or off. Default: Off |
| Variant | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the text changes. |
| [On press enter](../common-settings.md#events) | Triggers when the user presses Enter without Shift. Shift+Enter adds a new line. |
| [On focus](../common-settings.md#events) | Triggers when the field gets keyboard focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses keyboard focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Sets the text to the given **Value**. | `components.textarea1.setFieldValue("")` |
| Reset field | Sets the field back to the **Value** property. | `components.textarea1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.textarea1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.textarea1.blur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.textarea1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.textarea1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.textarea1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.textarea1.layout}}` |
| `value` | The text the field starts with. | `{{components.textarea1.value}}` |
| `placeholder` | Hint text shown while the field is empty. | `{{components.textarea1.placeholder}}` |
| `minRows` | Height of the field in rows when it's empty or short. | `{{components.textarea1.minRows}}` |
| `maxRows` | Number of rows the field grows to before it scrolls. `0` lets it grow without a limit. | `{{components.textarea1.maxRows}}` |
| `allowClear` | Shows a clear icon in the field once it has text. | `{{components.textarea1.allowClear}}` |
| `maxLength` | Most characters the user can type. `0` sets no limit. | `{{components.textarea1.maxLength}}` |
| `showCount` | Shows the number of characters typed, and the limit when **Max length** is set. | `{{components.textarea1.showCount}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.textarea1.variant}}` |
| `size` | Height and text size of the field. | `{{components.textarea1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
