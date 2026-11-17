---
id: schedule
title: Schedule
---

<div className="badge badge--primary">Ant Design</div>

The **Schedule** component shows bookings on a timeline, with resources such as rooms, vehicles or people down the side and time across. Users click a booking to open it or an empty slot to book it.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Resources | The rows of the schedule, as names such as `['Atlas', 'Cove']` or as `{ id, name, caption, avatar }` objects. Leave it empty to make one row per resource named in the bookings. | Array |
| Bookings | The bookings to place, such as the data from a query. Times can be ISO dates, `YYYY-MM-DD HH:mm`, `HH:mm` on the day shown, or `YYYY-MM-DD` for a whole day. | Array |
| Resource field (a resource's id or name) | Field in each booking that matches it to a resource, by the resource's id or name. | Text. Default: `room` |
| Start field | Field in each booking that holds its start time. | Text. Default: `start` |
| End field | Field in each booking that holds its end time. | Text. Default: `end` |
| Title field | Field shown as each booking's title. | Text. Default: `title` |
| Second line field | Field shown as a second line on each booking when there's room. | Text |
| Status field (toned by its words) | Field whose words color each booking, such as Confirmed in green, Pending in amber and Cancelled in red. | Text. Default: `status` |
| Id field | Field that identifies each booking. It's read into **selectedBookingId**. | Text. Default: `id` |
| Time across | `hours` shows the hours of one day across the top; `days` shows a run of days. | Hours, Days. Default: Hours |
| Date shown (empty for today) | The day shown, or the first day in the `days` view, such as `2026-11-17`. Leave it empty for today. | Text |
| Day starts at (hour, or a time such as 09:00) | First hour shown in the `hours` view, from 0 to 23, or a time such as `09:00`. | Number. Default: `8` |
| Day ends at (hour, or a time such as 18:00) | Last hour shown in the `hours` view, from 1 to 24, or a time such as `18:00`. | Number. Default: `18` |
| Slot length (minutes) | Length of each clickable empty slot in the `hours` view. | Number. Default: `30` |
| Days shown | Number of days shown in the `days` view. | Number. Default: `7` |
| Hour format | Whether times show on a `12h` or a `24h` clock. | 12h, 24h. Default: 12h |
| Resource column title | Heading of the resource column. | Text. Default: `Room` |
| Resource column width (px) | Width of the resource column. | Number. Default: `168` |
| Row height (px) | Height of each resource row. | Number. Default: `56` |
| Show the current time | Draws a line at the current time. | On or off. Default: On |
| Highlight the selected booking | Highlights the booking or slot the user clicked last. | On or off. Default: On |
| Empty text | Text shown when there are no resources. | Text. Default: `No resources to schedule` |
| Status colors | Colors for status words, such as `{ "on site": "#0ea5e9" }`. They override the automatic colors. | Object |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On booking clicked](../common-settings.md#events) | Triggers when the user clicks a booking. |
| [On slot clicked](../common-settings.md#events) | Triggers when the user clicks an empty slot. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `resources` | The rows of the schedule, as names such as `['Atlas', 'Cove']` or as `{ id, name, caption, avatar }` objects. Leave it empty to make one row per resource named in the bookings. | `{{components.schedule1.resources}}` |
| `bookings` | The bookings to place, such as the data from a query. Times can be ISO dates, `YYYY-MM-DD HH:mm`, `HH:mm` on the day shown, or `YYYY-MM-DD` for a whole day. | `{{components.schedule1.bookings}}` |
| `resourceField` | Field in each booking that matches it to a resource, by the resource's id or name. | `{{components.schedule1.resourceField}}` |
| `startField` | Field in each booking that holds its start time. | `{{components.schedule1.startField}}` |
| `endField` | Field in each booking that holds its end time. | `{{components.schedule1.endField}}` |
| `titleField` | Field shown as each booking's title. | `{{components.schedule1.titleField}}` |
| `subtitleField` | Field shown as a second line on each booking when there's room. | `{{components.schedule1.subtitleField}}` |
| `statusField` | Field whose words color each booking, such as Confirmed in green, Pending in amber and Cancelled in red. | `{{components.schedule1.statusField}}` |
| `idField` | Field that identifies each booking. It's read into **selectedBookingId**. | `{{components.schedule1.idField}}` |
| `scale` | `hours` shows the hours of one day across the top; `days` shows a run of days. | `{{components.schedule1.scale}}` |
| `date` | The day shown, or the first day in the `days` view, such as `2026-11-17`. Leave it empty for today. | `{{components.schedule1.date}}` |
| `dayStart` | First hour shown in the `hours` view, from 0 to 23, or a time such as `09:00`. | `{{components.schedule1.dayStart}}` |
| `dayEnd` | Last hour shown in the `hours` view, from 1 to 24, or a time such as `18:00`. | `{{components.schedule1.dayEnd}}` |
| `slotMinutes` | Length of each clickable empty slot in the `hours` view. | `{{components.schedule1.slotMinutes}}` |
| `days` | Number of days shown in the `days` view. | `{{components.schedule1.days}}` |
| `hourFormat` | Whether times show on a `12h` or a `24h` clock. | `{{components.schedule1.hourFormat}}` |
| `resourceTitle` | Heading of the resource column. | `{{components.schedule1.resourceTitle}}` |
| `resourceWidth` | Width of the resource column. | `{{components.schedule1.resourceWidth}}` |
| `rowHeight` | Height of each resource row. | `{{components.schedule1.rowHeight}}` |
| `showNowLine` | Draws a line at the current time. | `{{components.schedule1.showNowLine}}` |
| `highlightSelected` | Highlights the booking or slot the user clicked last. | `{{components.schedule1.highlightSelected}}` |
| `emptyText` | Text shown when there are no resources. | `{{components.schedule1.emptyText}}` |
| `statusColors` | Colors for status words, such as `{ "on site": "#0ea5e9" }`. They override the automatic colors. | `{{components.schedule1.statusColors}}` |
| `selectedBooking` | The data row of the booking the user clicked last, or `{}` after a slot is clicked. | `{{components.schedule1.selectedBooking}}` |
| `selectedBookingId` | Value of **Id field** in the clicked booking. | `{{components.schedule1.selectedBookingId}}` |
| `selectedSlot` | The empty slot the user clicked last, as `{ resourceId, resource, start, end, date, startTime, endTime, label }`, or `{}` after a booking is clicked. | `{{components.schedule1.selectedSlot}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | Theme: Surface 1 |
| Grid line color | Theme: Weak border |
| Label color | Theme: Primary text |
| Booking accent (bookings without a status, the selection) | Theme: Brand primary |
| Current time line color | `var(--cc-error-systemStatus)` |
| Border radius | — |
| Event radius | — |
