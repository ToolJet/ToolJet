---
id: switch
title: Switch
---

<div className="badge badge--primary">Ant Design</div>

The **Switch** component is Ant Design's on and off toggle. It turns a single setting on or off, such as email alerts or a feature flag, with its label beside it.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown beside the switch, or above it when **Layout** is `vertical`. | Text. Default: `Enabled` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `horizontal` puts it to the left of the switch, `vertical` puts it above. | `vertical`, `horizontal`. Default: `horizontal` |
| Checked | Whether the switch starts on. | On or off. Default: Off |
| Checked text | Short text shown inside the switch while it's on, such as `On`. | Text |
| Unchecked text | Short text shown inside the switch while it's off, such as `Off`. | Text |
| Size | Size of the switch. | `default`, `small`. Default: `default` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the switch turns on or off. |
| [On click](../common-settings.md#events) | Triggers when the user clicks the switch. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set checked | Turns the switch on or off to match **Checked**. | `components.switch1.setFieldValue("")` |
| Reset field | Sets the switch back to the **Checked** property. | `components.switch1.resetFields()` |
| Toggle | Flips the switch to the opposite state. | `components.switch1.toggle()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown beside the switch, or above it when **Layout** is `vertical`. | `{{components.switch1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.switch1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.switch1.tooltip}}` |
| `layout` | Where the label sits: `horizontal` puts it to the left of the switch, `vertical` puts it above. | `{{components.switch1.layout}}` |
| `checked` | Whether the switch starts on. | `{{components.switch1.checked}}` |
| `checkedChildren` | Short text shown inside the switch while it's on, such as `On`. | `{{components.switch1.checkedChildren}}` |
| `unCheckedChildren` | Short text shown inside the switch while it's off, such as `Off`. | `{{components.switch1.unCheckedChildren}}` |
| `size` | Size of the switch. | `{{components.switch1.size}}` |
| `value` | `true` while the switch is on, the same as **Checked**. A **Form** reads this key. | `{{components.switch1.value}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
