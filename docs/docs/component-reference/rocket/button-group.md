---
id: button-group
title: Button Group
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Button Group** component shows a row of joined buttons. Use it as a switch between options, such as Day, Week and Month, or as a set of related action buttons.

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
| On change | Triggers when the selection changes, by a click or by the **Set selected** or **Clear** action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set selected | Selects the button whose value matches **Value (or a list)**. In **Multiple** mode, pass a list to select several. A value no button has is ignored. | `components.buttongroup1.setSelected("")` |
| Clear | Clears the selection. | `components.buttongroup1.clear()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.buttongroup1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.buttongroup1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.buttongroup1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.buttongroup1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.buttongroup1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.buttongroup1.isDisabled}}` |

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
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
