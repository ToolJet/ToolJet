---
id: button-group
title: Button Group
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Button Group** component shows a row of joined buttons. Use it as a switch between options, such as Day, Week and Month, or as a set of related action buttons.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the buttons. | Text |
| Help text | Help text shown under the buttons. | Text |
| Buttons | The buttons, as text or objects with a `label` and `value`. Each can also have an `icon`, `tooltip`, `variant`, `disabled`, and `default` to start selected. | Array |
| Mode | How clicks behave. **Single** selects one button, **Multiple** toggles each button on or off, and **Actions** keeps no selection so the buttons only fire events. | Actions, Single, Multiple. Default: Single |
| Allow deselecting (single) | In **Single** mode, lets the user click the selected button again to clear the selection. | On or off. Default: Off |
| Variant | Look of the buttons. A button's own `variant` in **Buttons** overrides it. | Outline, Secondary, Default, Ghost. Default: Outline |
| Size | Height and text size of the buttons. | Sm, Default, Lg. Default: Default |
| Orientation | Lays the buttons out in a row or in a column. | Horizontal, Vertical. Default: Horizontal |
| Full width | Stretches the group to fill the component's width. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks any button. |
| [On change](../common-settings.md#events) | Triggers when the selection changes, by a click or by the **Set selected** or **Clear** action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set selected | Selects the button whose value matches **Value (or a list)**. In **Multiple** mode, pass a list to select several. A value no button has is ignored. | `components.buttongroup1.setSelected("")` |
| Clear | Clears the selection. | `components.buttongroup1.clear()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the buttons. | `{{components.buttongroup1.label}}` |
| `description` | Help text shown under the buttons. | `{{components.buttongroup1.description}}` |
| `buttons` | The buttons, as text or objects with a `label` and `value`. Each can also have an `icon`, `tooltip`, `variant`, `disabled`, and `default` to start selected. | `{{components.buttongroup1.buttons}}` |
| `mode` | How clicks behave. **Single** selects one button, **Multiple** toggles each button on or off, and **Actions** keeps no selection so the buttons only fire events. | `{{components.buttongroup1.mode}}` |
| `allowDeselect` | In **Single** mode, lets the user click the selected button again to clear the selection. | `{{components.buttongroup1.allowDeselect}}` |
| `variant` | Look of the buttons. A button's own `variant` in **Buttons** overrides it. | `{{components.buttongroup1.variant}}` |
| `size` | Height and text size of the buttons. | `{{components.buttongroup1.size}}` |
| `orientation` | Lays the buttons out in a row or in a column. | `{{components.buttongroup1.orientation}}` |
| `fullWidth` | Stretches the group to fill the component's width. | `{{components.buttongroup1.fullWidth}}` |
| `lastClicked` | The `label` and `value` of the button the user last clicked. | `{{components.buttongroup1.lastClicked}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Button background | Theme: Surface 1 |
| Button hover background | Theme: Surface 3 |
| Button text color | Theme: Primary text |
| Border and divider color | Theme: Default border |
| Selected background | Theme: Brand primary |
| Selected text color | Theme: Surface 1 |
| Icon color | Theme: Primary text |
| Label color | Theme: Primary text |
| Group radius | — |
