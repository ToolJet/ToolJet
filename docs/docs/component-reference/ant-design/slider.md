---
id: slider
title: Slider
---

<div className="badge badge--primary">Ant Design</div>

The **Slider** component is Ant Design's slider. Users drag a handle to pick a number in a range, or two handles to pick a range, such as a price band or a discount.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the slider, or beside it when **Layout** is `horizontal`. | Text. Default: `Volume` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | The starting number, or a `[from, to]` pair such as `[20, 80]` when **Range** is on. It's kept between **Min** and **Max** and on a **Step**. | Number. Default: `0` |
| Range | Shows two handles so the user picks a range. **Value** is then a `[from, to]` pair. | On or off. Default: Off |
| Min | Lowest number on the slider. | Number. Default: `0` |
| Max | Highest number on the slider. | Number. Default: `100` |
| Step | Amount the value changes by between stops. | Number. Default: `1` |
| Dots | Shows a dot at each step on the track. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers while the value changes, including at each step while the user drags. |
| [On change complete](../common-settings.md#events) | Triggers when the user releases the handle. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Sets the slider to the given **Value**, a number or a `[from, to]` pair with **Range** on. | `components.slider1.setFieldValue("")` |
| Reset field | Sets the slider back to the **Value** property. | `components.slider1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the slider, or beside it when **Layout** is `horizontal`. | `{{components.slider1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.slider1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.slider1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.slider1.layout}}` |
| `value` | The starting number, or a `[from, to]` pair such as `[20, 80]` when **Range** is on. It's kept between **Min** and **Max** and on a **Step**. | `{{components.slider1.value}}` |
| `range` | Shows two handles so the user picks a range. **Value** is then a `[from, to]` pair. | `{{components.slider1.range}}` |
| `min` | Lowest number on the slider. | `{{components.slider1.min}}` |
| `max` | Highest number on the slider. | `{{components.slider1.max}}` |
| `step` | Amount the value changes by between stops. | `{{components.slider1.step}}` |
| `dots` | Shows a dot at each step on the track. | `{{components.slider1.dots}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
