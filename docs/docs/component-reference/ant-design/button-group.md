---
id: button-group
title: Button Group
---

<div className="badge badge--primary">Ant Design</div>

The **Button Group** component shows a row of joined buttons. Use it for a set of related actions, or as a toggle to pick one or more options, such as Day, Week and Month.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the buttons. | Text |
| Buttons | The buttons, as a list of `{value, label}`. Add `icon` with an icon name, `disabled: true` or `danger: true` to change one button. | Array |
| Mode | How the buttons behave. `actions` makes each a plain button; `single` lets the user select one; `multiple` lets them select several; `none` shows the buttons disabled, for display only. | `actions`, `single`, `multiple`, `none`. Default: `actions` |
| Value | The selected button's value in `single` mode, or a list of values in `multiple` mode. Selected buttons are filled with the theme color. | Text |
| Allow deselect | In `single` mode, lets the user click the selected button again to clear the selection. | On or off. Default: Off |
| Type | Style of the buttons that aren't selected. `primary` is filled, `default` has a border, `dashed` has a dashed border and `text` has none. | `default`, `primary`, `dashed`, `text`. Default: `default` |
| Size | Height and text size of the buttons. | `small`, `middle`, `large`. Default: `middle` |
| Direction | Whether the buttons sit side by side or stacked. | `horizontal`, `vertical`. Default: `horizontal` |
| Block | Makes the group fill the width of its box, with the buttons sharing the space. | On or off. Default: Off |

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
| On click | Triggers when the user clicks any button. |
| On change | Triggers when the selection changes in `single` or `multiple` mode. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set selected | Selects the buttons with the given **Value**, or a list of values in `multiple` mode. It works only in `single` and `multiple` mode and ignores values no button has. | `components.buttongroup1.setSelected("")` |
| Clear | Clears the selection. | `components.buttongroup1.clear()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.buttongroup1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.buttongroup1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.buttongroup1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the buttons. | `{{components.buttongroup1.label}}` |
| `buttons` | The buttons, as a list of `{value, label}`. Add `icon` with an icon name, `disabled: true` or `danger: true` to change one button. | `{{components.buttongroup1.buttons}}` |
| `mode` | How the buttons behave. `actions` makes each a plain button; `single` lets the user select one; `multiple` lets them select several; `none` shows the buttons disabled, for display only. | `{{components.buttongroup1.mode}}` |
| `value` | The selected button's value in `single` mode, or a list of values in `multiple` mode. Selected buttons are filled with the theme color. | `{{components.buttongroup1.value}}` |
| `allowDeselect` | In `single` mode, lets the user click the selected button again to clear the selection. | `{{components.buttongroup1.allowDeselect}}` |
| `type` | Style of the buttons that aren't selected. `primary` is filled, `default` has a border, `dashed` has a dashed border and `text` has none. | `{{components.buttongroup1.type}}` |
| `size` | Height and text size of the buttons. | `{{components.buttongroup1.size}}` |
| `direction` | Whether the buttons sit side by side or stacked. | `{{components.buttongroup1.direction}}` |
| `block` | Makes the group fill the width of its box, with the buttons sharing the space. | `{{components.buttongroup1.block}}` |
| `lastClicked` | Value of the button the user clicked last. | `{{components.buttongroup1.lastClicked}}` |
| `isVisible` | Whether the component is visible. | `{{components.buttongroup1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.buttongroup1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.buttongroup1.isDisabled}}` |

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
