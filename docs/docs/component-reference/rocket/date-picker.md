---
id: date-picker
title: Date Picker
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Date Picker** component is a field where users pick one date, or a start and end date, from a calendar. Use it for due dates, booking dates or report periods.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Date` |
| Help text | A hint shown under the field. | Text |
| Mode | **Single** picks one date; **Range** picks a start and end date across a two-month calendar. | Single, Range. Default: Single |
| Placeholder | Text shown in the field before a date is picked. | Text. Default: `Pick a date` |
| Default (YYYY-MM-DD, or [start, end] for a range) | The date the field starts with, as `YYYY-MM-DD`, or `[start, end]` in **Range** mode. | Text |
| Display format | How the picked date is written in the field, for example `DD MMM YYYY` or `MM/DD/YYYY`. | Text. Default: `DD MMM YYYY` |
| Earliest date (YYYY-MM-DD) | The earliest date users can pick. Earlier days are greyed out. | Text |
| Latest date (YYYY-MM-DD) | The latest date users can pick. Later days are greyed out. | Text |
| Disabled dates | Dates users can't pick, as a list such as `['2026-12-25', '2026-12-26']`. | Array |
| Show clear button | Shows a button in the field that clears the picked date. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the picked date changes, from the calendar, the clear button or an action that sets a different date. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets the date in **Single** mode. **Format** says how **Value** is written; leave it empty to use the display format. | `components.datepicker1.setValue("", "")` |
| Clear value | Clears the picked date or range. | `components.datepicker1.clearValue()` |
| Set value in timestamp | Sets the date in **Single** mode from a Unix timestamp in milliseconds. | `components.datepicker1.setValueInTimestamp("")` |
| Set start date | Sets the start date in **Range** mode, read with **Format** when given. | `components.datepicker1.setStartDate("", "")` |
| Set end date | Sets the end date in **Range** mode, read with **Format** when given. | `components.datepicker1.setEndDate("", "")` |
| Set date range | Sets both ends of the range in **Range** mode. Dates given in the wrong order are swapped. | `components.datepicker1.setDateRange("", "", "")` |
| Clear start date | Clears the start date in **Range** mode. | `components.datepicker1.clearStartDate()` |
| Clear end date | Clears the end date in **Range** mode. | `components.datepicker1.clearEndDate()` |
| Clear date range | Clears both dates in **Range** mode. | `components.datepicker1.clearDateRange()` |
| Set min date | Changes the earliest date users can pick. | `components.datepicker1.setMinDate("")` |
| Set max date | Changes the latest date users can pick. | `components.datepicker1.setMaxDate("")` |
| Set disabled dates | Replaces the list of dates users can't pick. | `components.datepicker1.setDisabledDates("")` |
| Clear disabled dates | Makes all dates pickable again. | `components.datepicker1.clearDisabledDates()` |
| Set focus | Moves keyboard focus to the field. | `components.datepicker1.setFocus()` |
| Set blur | Closes the calendar and removes focus from the field. | `components.datepicker1.setBlur()` |
| Set date | Sets the date in **Single** mode from a `YYYY-MM-DD` value. | `components.datepicker1.setDate("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.datepicker1.label}}` |
| `description` | A hint shown under the field. | `{{components.datepicker1.description}}` |
| `mode` | **Single** picks one date; **Range** picks a start and end date across a two-month calendar. | `{{components.datepicker1.mode}}` |
| `placeholder` | Text shown in the field before a date is picked. | `{{components.datepicker1.placeholder}}` |
| `defaultValue` | The date the field starts with, as `YYYY-MM-DD`, or `[start, end]` in **Range** mode. | `{{components.datepicker1.defaultValue}}` |
| `format` | How the picked date is written in the field, for example `DD MMM YYYY` or `MM/DD/YYYY`. | `{{components.datepicker1.format}}` |
| `minDate` | The earliest date users can pick. Earlier days are greyed out. | `{{components.datepicker1.minDate}}` |
| `maxDate` | The latest date users can pick. Later days are greyed out. | `{{components.datepicker1.maxDate}}` |
| `disabledDates` | Dates users can't pick, as a list such as `['2026-12-25', '2026-12-26']`. | `{{components.datepicker1.disabledDates}}` |
| `showClearBtn` | Shows a button in the field that clears the picked date. | `{{components.datepicker1.showClearBtn}}` |
| `value` | The picked date as `YYYY-MM-DD`, or `[start, end]` in **Range** mode. | `{{components.datepicker1.value}}` |
| `startDate` | The start date in **Range** mode, as `YYYY-MM-DD`. | `{{components.datepicker1.startDate}}` |
| `endDate` | The end date in **Range** mode, as `YYYY-MM-DD`. | `{{components.datepicker1.endDate}}` |
| `unixTimestamp` | The picked date as a Unix timestamp in milliseconds, in **Single** mode. | `{{components.datepicker1.unixTimestamp}}` |
| `displayValue` | The date or range as shown in the field, in the display format. | `{{components.datepicker1.displayValue}}` |
| `startDateInUnix` | The start date as a Unix timestamp in milliseconds. | `{{components.datepicker1.startDateInUnix}}` |
| `endDateInUnix` | The end date as a Unix timestamp in milliseconds. | `{{components.datepicker1.endDateInUnix}}` |
| `selectedDateRange` | The range as shown in the field, for example `01 Dec 2026 – 05 Dec 2026`. | `{{components.datepicker1.selectedDateRange}}` |
| `dateFormat` | The display format the field uses. | `{{components.datepicker1.dateFormat}}` |

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
