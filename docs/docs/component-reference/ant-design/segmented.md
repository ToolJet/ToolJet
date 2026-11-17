---
id: segmented
title: Segmented
---

<div className="badge badge--primary">Ant Design</div>

The **Segmented** component is Ant Design's segmented control. It shows a few options as one joined bar for switching between views, such as daily, weekly and monthly.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `View` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Options | The choices, as plain values or as `{ label, value, disabled }` objects, such as `[{ label: 'Daily', value: 'daily' }]`. | Array |
| Value | Value of the option picked at the start. Leave it empty to start with no option picked. | Text |
| Block | Stretches the bar to the full width of the component, with equal-width options. | On or off. Default: Off |
| Alignment | Where the bar sits in the component's box when **Block** is off. | Left, Center, Right. Default: Left |
| Vertical | Stacks the options in a column instead of a row. | On or off. Default: Off |
| Size | Height and text size of the options. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the picked option changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Picks the option with the given **Value**. | `components.segmented1.setFieldValue("")` |
| Reset field | Sets the choice back to the **Value** property. | `components.segmented1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.segmented1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.segmented1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.segmented1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.segmented1.layout}}` |
| `options` | The choices, as plain values or as `{ label, value, disabled }` objects, such as `[{ label: 'Daily', value: 'daily' }]`. | `{{components.segmented1.options}}` |
| `value` | Value of the option picked at the start. Leave it empty to start with no option picked. | `{{components.segmented1.value}}` |
| `block` | Stretches the bar to the full width of the component, with equal-width options. | `{{components.segmented1.block}}` |
| `alignment` | Where the bar sits in the component's box when **Block** is off. | `{{components.segmented1.alignment}}` |
| `vertical` | Stacks the options in a column instead of a row. | `{{components.segmented1.vertical}}` |
| `size` | Height and text size of the options. | `{{components.segmented1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
