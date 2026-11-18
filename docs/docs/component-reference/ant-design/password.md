---
id: password
title: Password
---

<div className="badge badge--primary">Ant Design</div>

The **Password** component is Ant Design's password input. It hides what the user types, with an optional show and hide toggle and a strength meter.

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
| On change | Triggers when the password changes. |
| On press enter | Triggers when the user presses Enter in the field. |
| On focus | Triggers when the field gets keyboard focus. |
| On blur | Triggers when the field loses keyboard focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the password to the given **Value**. | `components.password1.setFieldValue("")` |
| Clear | Sets the field back to the **Value** property, which empties it when **Value** is empty. | `components.password1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.password1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.password1.blur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.password1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.password1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.password1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.password1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.password1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.password1.isDisabled}}` |

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
