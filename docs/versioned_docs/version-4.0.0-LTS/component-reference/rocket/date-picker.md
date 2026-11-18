---
id: date-picker
title: Date Picker
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Date Picker** component is a field where users pick one date, or a start and end date, from a calendar. Use it for due dates, booking dates or report periods.

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
| On select | Triggers when the picked date changes, from the calendar, the clear button or an action that sets a different date. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

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
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.datepicker1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.datepicker1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.datepicker1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.datepicker1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.datepicker1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.datepicker1.isDisabled}}` |

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
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
