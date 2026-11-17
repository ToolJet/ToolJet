---
id: otp
title: OTP
---

<div className="badge badge--primary">Ant Design</div>

The **OTP** component is Ant Design's one-time code input. It shows one box per character for entering a verification or sign-in code.

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

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On change | Triggers when the code changes. |
| On complete | Triggers when every box is filled. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Fills the boxes with the given **Value**. | `components.otp1.setFieldValue("")` |
| Clear | Sets the code back to the **Value** property, which empties the boxes when **Value** is empty. | `components.otp1.resetFields()` |
| Focus | Moves keyboard focus to the code boxes. | `components.otp1.focus()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.otp1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.otp1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.otp1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.otp1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.otp1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.otp1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
