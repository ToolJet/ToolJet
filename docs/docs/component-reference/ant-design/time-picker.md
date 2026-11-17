---
id: time-picker
title: Time Picker
---

<div className="badge badge--primary">Ant Design</div>

The **Time Picker** component is Ant Design's time input. Users pick a time of day from a dropdown, such as a delivery slot or a shift start.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Time` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | The starting time in 24-hour form, such as `09:30` or `14:05:30`. | Text |
| Format | How the time is shown in the field, such as `HH:mm`, `HH:mm:ss` or `h:mm a`. Seconds in the format add seconds to **Value**, which stays in 24-hour form. | Text. Default: `HH:mm` |
| Use 12 hours | Shows the time on a 12-hour clock with AM and PM. | On or off. Default: Off |
| Hour step | Gap between the hours offered, such as `2` for every other hour. | Number. Default: `1` |
| Minute step | Gap between the minutes offered, such as `15` for quarter hours. | Number. Default: `1` |
| Placeholder | Hint text shown while no time is picked. | Text. Default: `Pick a time` |
| Allow clear | Shows a clear icon in the field once a time is picked. | On or off. Default: On |
| Variant | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the picked time changes, including when it's cleared. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Sets the time to the given **Value**, such as `14:30`. Text that isn't a time is ignored, and empty text clears the field. | `components.timepicker1.setFieldValue("")` |
| Reset field | Sets the field back to the **Value** property. | `components.timepicker1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.timepicker1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.timepicker1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.timepicker1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.timepicker1.layout}}` |
| `value` | The starting time in 24-hour form, such as `09:30` or `14:05:30`. | `{{components.timepicker1.value}}` |
| `format` | How the time is shown in the field, such as `HH:mm`, `HH:mm:ss` or `h:mm a`. Seconds in the format add seconds to **Value**, which stays in 24-hour form. | `{{components.timepicker1.format}}` |
| `use12Hours` | Shows the time on a 12-hour clock with AM and PM. | `{{components.timepicker1.use12Hours}}` |
| `hourStep` | Gap between the hours offered, such as `2` for every other hour. | `{{components.timepicker1.hourStep}}` |
| `minuteStep` | Gap between the minutes offered, such as `15` for quarter hours. | `{{components.timepicker1.minuteStep}}` |
| `placeholder` | Hint text shown while no time is picked. | `{{components.timepicker1.placeholder}}` |
| `allowClear` | Shows a clear icon in the field once a time is picked. | `{{components.timepicker1.allowClear}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.timepicker1.variant}}` |
| `size` | Height and text size of the field. | `{{components.timepicker1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
