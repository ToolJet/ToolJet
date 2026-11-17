---
id: date-time-picker
title: Date Time Picker
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Date Time Picker** component is a field where users pick a date from a calendar and a time of day. Use it for appointments, deadlines or scheduled jobs.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Date and time` |
| Help text | A hint shown under the field. | Text |
| Placeholder | Text shown in the field before a date and time are picked. | Text. Default: `Pick a date and time` |
| Default value (YYYY-MM-DD HH:mm) | The date and time the field starts with, as `YYYY-MM-DD HH:mm`. | Text |
| Date display format | How the date part is written in the field, for example `DD MMM YYYY` or `MM/DD/YYYY`. | Text. Default: `DD MMM YYYY` |
| Time format | Shows times on a 12-hour clock with AM and PM, or on a 24-hour clock. | 12h, 24h. Default: 12h |
| Minute step | The gap between the minutes users can pick, for example `15` for :00, :15, :30 and :45. | Number. Default: `5` |
| Earliest date (YYYY-MM-DD) | The earliest date users can pick. Earlier days are greyed out. | Text |
| Latest date (YYYY-MM-DD) | The latest date users can pick. Later days are greyed out. | Text |
| Disabled dates | Dates users can't pick, as a list such as `['2026-12-25', '2026-12-26']`. | Array |
| Show clear button | Shows a button in the field that clears the picked date and time. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the user picks or clears a date or time. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the date and time. **Format** says how **Value** is written; leave it empty to use the field's display format. | `components.datetimepicker1.setValue("", "")` |
| Set value in timestamp | Sets the date and time from a Unix timestamp in milliseconds. | `components.datetimepicker1.setValueInTimestamp("")` |
| Set time | Sets the time of day and keeps the picked date, or uses today when none is picked. | `components.datetimepicker1.setTime("", "")` |
| Clear value | Clears the picked date and time. | `components.datetimepicker1.clearValue()` |
| Set min date | Changes the earliest date users can pick. | `components.datetimepicker1.setMinDate("")` |
| Set max date | Changes the latest date users can pick. | `components.datetimepicker1.setMaxDate("")` |
| Set disabled dates | Replaces the list of dates users can't pick. | `components.datetimepicker1.setDisabledDates("")` |
| Clear disabled dates | Makes all dates pickable again. | `components.datetimepicker1.clearDisabledDates()` |
| Set focus | Moves keyboard focus to the field. | `components.datetimepicker1.setFocus()` |
| Set blur | Closes the picker and removes focus from the field. | `components.datetimepicker1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.datetimepicker1.label}}` |
| `description` | A hint shown under the field. | `{{components.datetimepicker1.description}}` |
| `placeholder` | Text shown in the field before a date and time are picked. | `{{components.datetimepicker1.placeholder}}` |
| `defaultValue` | The date and time the field starts with, as `YYYY-MM-DD HH:mm`. | `{{components.datetimepicker1.defaultValue}}` |
| `dateFormat` | How the date part is written in the field, for example `DD MMM YYYY` or `MM/DD/YYYY`. | `{{components.datetimepicker1.dateFormat}}` |
| `timeFormat` | Shows times on a 12-hour clock with AM and PM, or on a 24-hour clock. | `{{components.datetimepicker1.timeFormat}}` |
| `minuteStep` | The gap between the minutes users can pick, for example `15` for :00, :15, :30 and :45. | `{{components.datetimepicker1.minuteStep}}` |
| `minDate` | The earliest date users can pick. Earlier days are greyed out. | `{{components.datetimepicker1.minDate}}` |
| `maxDate` | The latest date users can pick. Later days are greyed out. | `{{components.datetimepicker1.maxDate}}` |
| `disabledDates` | Dates users can't pick, as a list such as `['2026-12-25', '2026-12-26']`. | `{{components.datetimepicker1.disabledDates}}` |
| `showClearBtn` | Shows a button in the field that clears the picked date and time. | `{{components.datetimepicker1.showClearBtn}}` |
| `value` | The picked date and time as `YYYY-MM-DDTHH:mm` in local time. | `{{components.datetimepicker1.value}}` |
| `selectedDate` | The picked date as `YYYY-MM-DD`. | `{{components.datetimepicker1.selectedDate}}` |
| `selectedTime` | The picked time as `HH:mm` on a 24-hour clock. | `{{components.datetimepicker1.selectedTime}}` |
| `unixTimestamp` | The picked date and time as a Unix timestamp in milliseconds. | `{{components.datetimepicker1.unixTimestamp}}` |
| `displayValue` | The date and time as shown in the field. | `{{components.datetimepicker1.displayValue}}` |

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
| Calendar icon color | Theme: Primary text |
| Popover background | Theme: Surface 1 |
| Popover text color | Theme: Primary text |
| Popover item hover background | Theme: Surface 3 |
| Selected item text color (on the accent) | Theme: Surface 1 |
