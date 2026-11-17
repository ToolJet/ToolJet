---
id: otp-input
title: Otp Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Otp Input** component collects a short one-time code, one character per box, such as a sign-in or verification code. It accepts pasted codes and the phone's code autofill.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the boxes. | Text. Default: `Verification code` |
| Help text | Hint text shown under the boxes. | Text |
| Length (4 to 8) | Number of boxes, from `4` to `8`. A partly filled code shows an error asking for all the characters. | Number. Default: `6` |
| Characters | Which characters the boxes accept. **Digits** takes only numbers; **Letters and digits** also takes letters, shown in uppercase. | Digits, Letters and digits. Default: Digits |
| Separator in the middle | Splits the boxes into two halves with a dash between them. | On or off. Default: Off |
| Boxes | **Joined** draws the boxes as one connected strip; **Separate** spaces them apart. | Joined, Separate. Default: Joined |
| Mask characters | Shows a dot in each filled box instead of the character. | On or off. Default: Off |
| Placeholder (one character per box) | Hint shown in empty boxes, one character per box. A single character is shown in every box. | Text |
| Default value | Code filled in when the app loads. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the code changes. |
| [On complete](../common-settings.md#events) | Triggers when the user fills the last empty box. |
| [On focus](../common-settings.md#events) | Triggers when the boxes get focus. |
| [On blur](../common-settings.md#events) | Triggers when the boxes lose focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear | Empties all the boxes. | `components.otpinput1.clear()` |
| Set focus | Moves keyboard focus to the first empty box. | `components.otpinput1.setFocus()` |
| Set blur | Removes focus from the boxes. | `components.otpinput1.setBlur()` |
| Set text | Fills the boxes with the given **Value**. Characters the boxes don't accept are dropped. | `components.otpinput1.setText("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the boxes. | `{{components.otpinput1.label}}` |
| `description` | Hint text shown under the boxes. | `{{components.otpinput1.description}}` |
| `length` | Number of boxes, from `4` to `8`. A partly filled code shows an error asking for all the characters. | `{{components.otpinput1.length}}` |
| `characters` | Which characters the boxes accept. **Digits** takes only numbers; **Letters and digits** also takes letters, shown in uppercase. | `{{components.otpinput1.characters}}` |
| `separator` | Splits the boxes into two halves with a dash between them. | `{{components.otpinput1.separator}}` |
| `slotStyle` | **Joined** draws the boxes as one connected strip; **Separate** spaces them apart. | `{{components.otpinput1.slotStyle}}` |
| `masked` | Shows a dot in each filled box instead of the character. | `{{components.otpinput1.masked}}` |
| `placeholder` | Hint shown in empty boxes, one character per box. A single character is shown in every box. | `{{components.otpinput1.placeholder}}` |
| `defaultValue` | Code filled in when the app loads. | `{{components.otpinput1.defaultValue}}` |
| `value` | The code entered so far. | `{{components.otpinput1.value}}` |
| `isComplete` | Whether every box is filled. | `{{components.otpinput1.isComplete}}` |

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
| Separator color | Theme: Placeholder text |
| Box size | `36` |
