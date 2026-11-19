---
id: switch
title: Switch
---

<div className="badge badge--primary">Ant Design</div>

The **Switch** component is Ant Design's on and off toggle. It turns a single setting on or off, such as email alerts or a feature flag, with its label beside it.

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
| On click | Triggers when the user clicks the switch. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set checked | Turns the switch on or off to match **Checked**. | `components.switch1.setFieldValue("")` |
| Reset field | Sets the switch back to the **Checked** property. | `components.switch1.resetFields()` |
| Toggle | Flips the switch to the opposite state. | `components.switch1.toggle()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.switch1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.switch1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.switch1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.switch1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.switch1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.switch1.isDisabled}}` |

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
