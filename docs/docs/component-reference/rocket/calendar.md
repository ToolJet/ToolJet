---
id: calendar
title: Calendar
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Calendar** component shows a month on the page for the user to pick one date, several dates or a date range. Markers can flag days with events, such as deliveries or leave.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Selection mode | What the user picks: one date (**Single**), several dates (**Multiple**) or a start and end date (**Range**). | Single, Multiple, Range. Default: Single |
| Default value (YYYY-MM-DD, a list, or [start, end]) | Dates selected at the start: a date such as `2026-03-14`, a list of dates for **Multiple**, or `[start, end]` for **Range**. | Text |
| Month to show (date; default: the selection or today) | Any date in the month to show first. When empty, the calendar opens on the selected date or today. | Text |
| Markers | Days to mark with a dot, as dates or `{ date, label, color }` objects. The label shows when the user hovers over the day. | Array |
| Min date | The earliest date the user can pick. | Text |
| Max date | The latest date the user can pick. | Text |
| Disabled dates | Dates the user can't pick, such as holidays. | Array |
| Disabled weekdays (0 = Sunday) | Weekdays the user can't pick, as numbers from `0` (Sunday) to `6` (Saturday) or day names. | Array |
| Week starts on | The day shown in the first column of each week. | Sunday, Monday, Saturday. Default: Sunday |
| Number of months | How many months to show side by side, from `1` to `3`. | Number. Default: `1` |
| Show outside days | Shows the days of the previous and next month that fill the first and last weeks. | On or off. Default: On |
| Always six weeks | Always shows six weeks, so the calendar keeps the same height from month to month. | On or off. Default: Off |
| Full width | Stretches the calendar to fill the component's width. | On or off. Default: Off |
| Show border | Draws a border around the calendar. | On or off. Default: On |
| Loading look | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | Spinner, Skeleton. Default: Spinner |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On select | Triggers when the selected dates change, by a click or by the **Select date** or **Clear** action. |
| On month changed | Triggers when the user moves to another month. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select date | Selects **Date** and shows its month. In **Range** mode, **End date** sets the end of the range; in **Multiple** mode, the date is added to the selection. Dates the user couldn't pick are ignored. | `components.calendar1.selectDate("", "")` |
| Clear | Clears the selected dates. | `components.calendar1.clear()` |
| Set month | Shows the month that contains **Date**, such as `2026-03` or `2026-03-14`. | `components.calendar1.setMonth("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.calendar1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.calendar1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.calendar1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `mode` | What the user picks: one date (**Single**), several dates (**Multiple**) or a start and end date (**Range**). | `{{components.calendar1.mode}}` |
| `defaultValue` | Dates selected at the start: a date such as `2026-03-14`, a list of dates for **Multiple**, or `[start, end]` for **Range**. | `{{components.calendar1.defaultValue}}` |
| `defaultMonth` | Any date in the month to show first. When empty, the calendar opens on the selected date or today. | `{{components.calendar1.defaultMonth}}` |
| `markers` | Days to mark with a dot, as dates or `{ date, label, color }` objects. The label shows when the user hovers over the day. | `{{components.calendar1.markers}}` |
| `minDate` | The earliest date the user can pick. | `{{components.calendar1.minDate}}` |
| `maxDate` | The latest date the user can pick. | `{{components.calendar1.maxDate}}` |
| `disabledDates` | Dates the user can't pick, such as holidays. | `{{components.calendar1.disabledDates}}` |
| `disabledDays` | Weekdays the user can't pick, as numbers from `0` (Sunday) to `6` (Saturday) or day names. | `{{components.calendar1.disabledDays}}` |
| `weekStartsOn` | The day shown in the first column of each week. | `{{components.calendar1.weekStartsOn}}` |
| `numberOfMonths` | How many months to show side by side, from `1` to `3`. | `{{components.calendar1.numberOfMonths}}` |
| `showOutsideDays` | Shows the days of the previous and next month that fill the first and last weeks. | `{{components.calendar1.showOutsideDays}}` |
| `fixedWeeks` | Always shows six weeks, so the calendar keeps the same height from month to month. | `{{components.calendar1.fixedWeeks}}` |
| `fullWidth` | Stretches the calendar to fill the component's width. | `{{components.calendar1.fullWidth}}` |
| `showBorder` | Draws a border around the calendar. | `{{components.calendar1.showBorder}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a grey **Skeleton** block. | `{{components.calendar1.loadingIndicator}}` |
| `value` | The selection: a date in `YYYY-MM-DD` form, a list of dates in **Multiple** mode, or `[start, end]` in **Range** mode. | `{{components.calendar1.value}}` |
| `selectedDate` | The selected date, or the first one in **Multiple** and **Range** modes. | `{{components.calendar1.selectedDate}}` |
| `selectedDates` | List of all selected dates. | `{{components.calendar1.selectedDates}}` |
| `startDate` | Start of the range in **Range** mode. | `{{components.calendar1.startDate}}` |
| `endDate` | End of the range in **Range** mode. | `{{components.calendar1.endDate}}` |
| `visibleMonth` | The first month on screen, in `YYYY-MM` form. | `{{components.calendar1.visibleMonth}}` |
| `visibleStart` | First day of the months on screen. | `{{components.calendar1.visibleStart}}` |
| `visibleEnd` | Last day of the months on screen. | `{{components.calendar1.visibleEnd}}` |
| `isVisible` | Whether the component is visible. | `{{components.calendar1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.calendar1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.calendar1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | `transparent` |
| Border color | Theme: Default border |
| Day text color | Theme: Primary text |
| Month title color | Theme: Primary text |
| Weekday and outside day color | Theme: Placeholder text |
| Selected day background | Theme: Brand primary |
| Selected day text color | Theme: Surface 1 |
| Range background | Theme: Surface 3 |
| Today background | Theme: Surface 3 |
| Day hover background | Theme: Surface 3 |
| Marker dot color | Theme: Brand primary |
| Calendar radius | — |
| Day size (px) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
