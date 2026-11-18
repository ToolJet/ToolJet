---
id: checkbox
title: Checkbox
---

<div className="badge badge--primary">Ant Design</div>

The **Checkbox** component lets users turn a single option on or off, such as accepting terms or marking a task done.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown next to the checkbox. | Text. Default: `Checkbox` |
| Checked | Whether the box starts checked. **Reset field** returns to this value. | On or off. Default: Off |
| Indeterminate | Shows a dash in the box while it is unchecked, to mean a partial selection, such as when only some items in a group are checked. | On or off. Default: Off |
| Extra | Help text shown under the checkbox. A validation message replaces it while the value is invalid. | Text |

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
| On change | Triggers when the checkbox is checked or unchecked, by the user or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set checked | Checks or unchecks the box, as set by **Checked**. | `components.checkbox1.setFieldValue("")` |
| Reset field | Returns the box to the **Checked** property's value. | `components.checkbox1.resetFields()` |
| Toggle | Switches the box between checked and unchecked. | `components.checkbox1.toggle()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.checkbox1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.checkbox1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.checkbox1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown next to the checkbox. | `{{components.checkbox1.children}}` |
| `checked` | Whether the box starts checked. **Reset field** returns to this value. | `{{components.checkbox1.checked}}` |
| `indeterminate` | Shows a dash in the box while it is unchecked, to mean a partial selection, such as when only some items in a group are checked. | `{{components.checkbox1.indeterminate}}` |
| `extra` | Help text shown under the checkbox. A validation message replaces it while the value is invalid. | `{{components.checkbox1.extra}}` |
| `value` | `true` when the box is checked, `false` when not. | `{{components.checkbox1.value}}` |
| `isVisible` | Whether the component is visible. | `{{components.checkbox1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.checkbox1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.checkbox1.isDisabled}}` |

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
