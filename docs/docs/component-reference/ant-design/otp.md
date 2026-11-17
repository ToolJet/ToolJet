---
id: otp
title: OTP
---

<div className="badge badge--primary">Ant Design</div>

The **OTP** component is Ant Design's one-time code input. It shows one box per character for entering a verification or sign-in code.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown with the code boxes. | Text. Default: `Verification code` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Length | Number of characters in the code, and so the number of boxes. | Number. Default: `6` |
| Characters | Characters the boxes accept. `numeric` takes digits only; `alphanumeric` also takes letters, which show in upper case. | `numeric`, `alphanumeric`. Default: `numeric` |
| Mask | Hides each typed character behind a dot. | On or off. Default: Off |
| Value | The code the boxes start with. Characters the code doesn't accept are dropped, and it's cut to **Length**. | Text |
| Variant | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the code changes. |
| [On complete](../common-settings.md#events) | Triggers when every box is filled. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Fills the boxes with the given **Value**. | `components.otp1.setFieldValue("")` |
| Clear | Sets the code back to the **Value** property, which empties the boxes when **Value** is empty. | `components.otp1.resetFields()` |
| Focus | Moves keyboard focus to the code boxes. | `components.otp1.focus()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown with the code boxes. | `{{components.otp1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.otp1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.otp1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.otp1.layout}}` |
| `length` | Number of characters in the code, and so the number of boxes. | `{{components.otp1.length}}` |
| `characters` | Characters the boxes accept. `numeric` takes digits only; `alphanumeric` also takes letters, which show in upper case. | `{{components.otp1.characters}}` |
| `mask` | Hides each typed character behind a dot. | `{{components.otp1.mask}}` |
| `value` | The code the boxes start with. Characters the code doesn't accept are dropped, and it's cut to **Length**. | `{{components.otp1.value}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.otp1.variant}}` |
| `size` | Height and text size of the field. | `{{components.otp1.size}}` |
| `isComplete` | `true` when every box is filled. | `{{components.otp1.isComplete}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
