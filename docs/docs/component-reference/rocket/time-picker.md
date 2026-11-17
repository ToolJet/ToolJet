---
id: time-picker
title: Time Picker
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Time Picker** component lets the user pick a time of day from a dropdown, such as a meeting start, a delivery window or a shift time.

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
| On select | Triggers when the picked time changes. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the time to the given **Value**. Give a **Format**, such as `hh:mm A`, when the value isn't in `HH:mm` form. | `components.timepicker1.setValue("", "")` |
| Clear value | Clears the picked time. | `components.timepicker1.clearValue()` |
| Set min time | Changes the earliest time the user can pick. | `components.timepicker1.setMinTime("")` |
| Set max time | Changes the latest time the user can pick. | `components.timepicker1.setMaxTime("")` |
| Set focus | Moves keyboard focus to the field. | `components.timepicker1.setFocus()` |
| Set blur | Closes the picker and removes focus from the field. | `components.timepicker1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.timepicker1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.timepicker1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.timepicker1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.timepicker1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.timepicker1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.timepicker1.isDisabled}}` |

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
| Error color (message and border) | Theme: Error |
| Field radius | — |
| Clock icon color | Theme: Primary text |
| Popover background | Theme: Surface 1 |
| Popover text color | Theme: Primary text |
| Popover item hover background | Theme: Surface 3 |
| Selected item text color (on the accent) | Theme: Surface 1 |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
