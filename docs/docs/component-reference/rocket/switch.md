---
id: switch
title: Switch
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Switch** component is an on/off toggle with a label, for settings that take effect right away, such as turning notifications on or marking a record as active.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown next to the switch. | Text. Default: `Enabled` |
| Help text | Hint text shown under the label. | Text |
| On by default | Turns the switch on when the app loads. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the switch turns on or off. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Toggle | Flips the switch to the opposite state. | `components.switch1.toggle()` |
| Set value | Turns the switch on or off to match the given **Value**. | `components.switch1.setValue(true)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown next to the switch. | `{{components.switch1.label}}` |
| `description` | Hint text shown under the label. | `{{components.switch1.description}}` |
| `defaultChecked` | Turns the switch on when the app loads. | `{{components.switch1.defaultChecked}}` |
| `value` | Whether the switch is on. | `{{components.switch1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Switch on color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Switch off color | Theme: Default border |
| Label color (earlier name) | — |
