---
id: input
title: Input
---

<div className="badge badge--primary">Ant Design</div>

The **Input** component is a single-line text field for entering values such as a name, an email address or a search term.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Label` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Text in the field when the app loads. **Reset field** returns to this value. | Text |
| Placeholder | Hint shown in the field while it is empty. | Text. Default: `Enter your input` |
| Type | Kind of text the field expects. `email` and `url` show an error for text that isn't a valid address; `password` hides the text and adds a button to show it. | `text`, `email`, `password`, `url`, `tel`, `search`. Default: `text` |
| Allow clear | Shows a button in the field that clears the text. | On or off. Default: Off |
| Max length | Most characters the user can type. Leave it at `0` for no limit. | Number. Default: `0` |
| Show count | Shows the number of characters typed, and the limit when **Max length** is set. | On or off. Default: Off |
| Prefix | Text or an icon shown inside the field before the text, such as `SearchOutlined`. | Text |
| Suffix | Text or an icon shown inside the field after the text, such as `MailOutlined`. | Text |
| Addon before | Text shown in a gray box attached to the start of the field, such as `https://`. | Text |
| Addon after | Text shown in a gray box attached to the end of the field, such as `.com`. | Text |
| Variant | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the text changes, by typing or an action. |
| [On press enter](../common-settings.md#events) | Triggers when the user presses Enter in the field. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |
| [On clear](../common-settings.md#events) | Triggers when the user clears the field with its clear button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the text to the given **Value** and fires **On change**. | `components.input1.setFieldValue("")` |
| Reset field | Returns the text to the **Value** property's value. | `components.input1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.input1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.input1.blur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.input1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.input1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.input1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.input1.layout}}` |
| `value` | Text in the field when the app loads. **Reset field** returns to this value. | `{{components.input1.value}}` |
| `placeholder` | Hint shown in the field while it is empty. | `{{components.input1.placeholder}}` |
| `type` | Kind of text the field expects. `email` and `url` show an error for text that isn't a valid address; `password` hides the text and adds a button to show it. | `{{components.input1.type}}` |
| `allowClear` | Shows a button in the field that clears the text. | `{{components.input1.allowClear}}` |
| `maxLength` | Most characters the user can type. Leave it at `0` for no limit. | `{{components.input1.maxLength}}` |
| `showCount` | Shows the number of characters typed, and the limit when **Max length** is set. | `{{components.input1.showCount}}` |
| `prefix` | Text or an icon shown inside the field before the text, such as `SearchOutlined`. | `{{components.input1.prefix}}` |
| `suffix` | Text or an icon shown inside the field after the text, such as `MailOutlined`. | `{{components.input1.suffix}}` |
| `addonBefore` | Text shown in a gray box attached to the start of the field, such as `https://`. | `{{components.input1.addonBefore}}` |
| `addonAfter` | Text shown in a gray box attached to the end of the field, such as `.com`. | `{{components.input1.addonAfter}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.input1.variant}}` |
| `size` | Height and text size of the field. | `{{components.input1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
