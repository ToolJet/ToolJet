---
id: switch
title: Switch
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Switch** component is an on/off toggle with a label, for settings that take effect right away, such as turning notifications on or marking a record as active.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown next to the switch. | Text. Default: `Enabled` |
| Help text | Hint text shown under the label. | Text |
| On by default | Turns the switch on when the app loads. | On or off. Default: Off |

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
| On change | Triggers when the switch turns on or off. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Toggle | Flips the switch to the opposite state. | `components.switch1.toggle()` |
| Set value | Turns the switch on or off to match the given **Value**. | `components.switch1.setValue(true)` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.switch1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.switch1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.switch1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown next to the switch. | `{{components.switch1.label}}` |
| `description` | Hint text shown under the label. | `{{components.switch1.description}}` |
| `defaultChecked` | Turns the switch on when the app loads. | `{{components.switch1.defaultChecked}}` |
| `value` | Whether the switch is on. | `{{components.switch1.value}}` |
| `isVisible` | Whether the component is visible. | `{{components.switch1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.switch1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.switch1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Switch on color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Switch off color | Theme: Default border |
| Label color (earlier name) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
