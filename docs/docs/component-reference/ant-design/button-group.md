---
id: button-group
title: Button Group
---

<div className="badge badge--primary">Ant Design</div>

The **Button Group** component shows a row of joined buttons. Use it for a set of related actions, or as a toggle to pick one or more options, such as Day, Week and Month.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks any button. |
| [On change](../common-settings.md#events) | Triggers when the selection changes in `single` or `multiple` mode. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set selected | Selects the buttons with the given **Value**, or a list of values in `multiple` mode. It works only in `single` and `multiple` mode and ignores values no button has. | `components.buttongroup1.setSelected("")` |
| Clear | Clears the selection. | `components.buttongroup1.clear()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
