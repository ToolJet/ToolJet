---
id: time-picker
title: Time Picker
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Time Picker** component lets the user pick a time of day from a dropdown, such as a meeting start, a delivery window or a shift time.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Time` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when no time is picked. | Text. Default: `Pick a time` |
| Default value (HH:mm) | Time picked when the app loads, in 24-hour `HH:mm` form, such as `14:30`. | Text |
| Time format | Whether times show on a 12-hour clock with AM and PM, or a 24-hour clock. | 12h, 24h. Default: 12h |
| Picker | **Columns** shows separate hour and minute columns; **List** shows one scrolling list of times. | Columns, List. Default: Columns |
| Minute step | Gap in minutes between the times offered, such as `15` for quarter hours. | Number. Default: `15` |
| Earliest time (HH:mm) | Earliest time the user can pick, in `HH:mm` form. An earlier time shows an error. | Text |
| Latest time (HH:mm) | Latest time the user can pick, in `HH:mm` form. A later time shows an error. | Text |
| Show clear button | Shows a button in the field that clears the time. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the picked time changes. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the time to the given **Value**. Give a **Format**, such as `hh:mm A`, when the value isn't in `HH:mm` form. | `components.timepicker1.setValue("", "")` |
| Clear value | Clears the picked time. | `components.timepicker1.clearValue()` |
| Set min time | Changes the earliest time the user can pick. | `components.timepicker1.setMinTime("")` |
| Set max time | Changes the latest time the user can pick. | `components.timepicker1.setMaxTime("")` |
| Set focus | Moves keyboard focus to the field. | `components.timepicker1.setFocus()` |
| Set blur | Closes the picker and removes focus from the field. | `components.timepicker1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.timepicker1.label}}` |
| `description` | Hint text shown under the field. | `{{components.timepicker1.description}}` |
| `placeholder` | Text shown in the field when no time is picked. | `{{components.timepicker1.placeholder}}` |
| `defaultValue` | Time picked when the app loads, in 24-hour `HH:mm` form, such as `14:30`. | `{{components.timepicker1.defaultValue}}` |
| `timeFormat` | Whether times show on a 12-hour clock with AM and PM, or a 24-hour clock. | `{{components.timepicker1.timeFormat}}` |
| `pickerStyle` | **Columns** shows separate hour and minute columns; **List** shows one scrolling list of times. | `{{components.timepicker1.pickerStyle}}` |
| `minuteStep` | Gap in minutes between the times offered, such as `15` for quarter hours. | `{{components.timepicker1.minuteStep}}` |
| `minTime` | Earliest time the user can pick, in `HH:mm` form. An earlier time shows an error. | `{{components.timepicker1.minTime}}` |
| `maxTime` | Latest time the user can pick, in `HH:mm` form. A later time shows an error. | `{{components.timepicker1.maxTime}}` |
| `showClearBtn` | Shows a button in the field that clears the time. | `{{components.timepicker1.showClearBtn}}` |
| `value` | The picked time in 24-hour `HH:mm` form, such as `14:30`. | `{{components.timepicker1.value}}` |
| `formattedValue` | The picked time as the field shows it, such as `2:30 PM`. | `{{components.timepicker1.formattedValue}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Field background | Theme: Surface 1 |
| Field text color | Theme: Primary text |
| Placeholder color | Theme: Placeholder text |
| Field border color | Theme: Default border |
| Accent (focus ring, selection) | Theme: Brand primary |
| Error color (message and border) | `var(--cc-error-systemStatus)` |
| Field radius | — |
| Clock icon color | Theme: Primary text |
| Popover background | Theme: Surface 1 |
| Popover text color | Theme: Primary text |
| Popover item hover background | Theme: Surface 3 |
| Selected item text color (on the accent) | Theme: Surface 1 |
