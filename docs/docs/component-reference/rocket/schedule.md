---
id: schedule
title: Schedule
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Schedule** component shows bookings on a timeline, with resources such as rooms, people or vehicles down the side and time across. The user can click a booking to open it or click a free slot to book it.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Resources | Rows of the schedule, as plain names or as items with an `id`, `name`, `caption` and `avatar`. Leave empty to list each resource the bookings name. | Array |
| Bookings | Bookings to place on the timeline. Times can be full dates and times, `HH:mm` on the day shown, or a date alone for a whole day. | Array |
| Resource field (a resource's id or name) | Field in each booking that matches it to a resource, by the resource's id or name. | Text. Default: `room` |
| Start field | Field with the booking's start time. | Text. Default: `start` |
| End field | Field with the booking's end time. | Text. Default: `end` |
| Title field | Field shown as the booking's title. | Text. Default: `title` |
| Second line field | Field shown as a second line on the booking when there is room. | Text |
| Status field (toned by its words) | Field whose value colors the booking. Common words such as `Confirmed` or `Pending` get a matching tone, and a status containing `cancel` is struck through. | Text. Default: `status` |
| Id field | Field that identifies each booking. It fills **selectedBookingId** when the user clicks a booking. | Text. Default: `id` |
| Time across | **Hours** shows the hours of one day across; **Days** shows a run of days. | Hours, Days. Default: Hours |
| Date shown (empty for today) | Date to show, or the first day in the **Days** view. Leave empty for today. | Text |
| Day starts at (hour, or a time such as 09:00) | Hour the **Hours** view starts at, such as `8` or `09:00`. | Number. Default: `8` |
| Day ends at (hour, or a time such as 18:00) | Hour the **Hours** view ends at, such as `18` or `18:00`. | Number. Default: `18` |
| Slot length (minutes) | Length in minutes of each clickable slot in the **Hours** view. | Number. Default: `30` |
| Days shown | Number of days shown in the **Days** view. | Number. Default: `7` |
| Hour format | Whether times show on a 12-hour or 24-hour clock. | 12h, 24h. Default: 12h |
| Resource column title | Heading of the resource column, such as `Room` or `Driver`. | Text. Default: `Room` |
| Resource column width (px) | Width of the resource column in pixels. | Number. Default: `168` |
| Row height (px) | Height of each resource row in pixels. Rows with overlapping bookings grow to fit them. | Number. Default: `56` |
| Show the current time | Draws a line at the current time. | On or off. Default: On |
| Highlight the selected booking | Marks the booking or slot the user clicked last. | On or off. Default: On |
| Empty text | Message shown when there are no resources. | Text. Default: `No resources to schedule` |
| Status colors | A color for each status word, for example `{ "on site": "#0ea5e9" }`. Overrides the automatic tone. | Object |
| Loading look | What shows while the schedule is loading: a spinner or a skeleton outline. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On booking clicked](../common-settings.md#events) | Triggers when the user clicks a booking. |
| [On slot clicked](../common-settings.md#events) | Triggers when the user clicks a free or partly booked slot. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `resources` | Rows of the schedule, as plain names or as items with an `id`, `name`, `caption` and `avatar`. Leave empty to list each resource the bookings name. | `{{components.schedule1.resources}}` |
| `bookings` | Bookings to place on the timeline. Times can be full dates and times, `HH:mm` on the day shown, or a date alone for a whole day. | `{{components.schedule1.bookings}}` |
| `resourceField` | Field in each booking that matches it to a resource, by the resource's id or name. | `{{components.schedule1.resourceField}}` |
| `startField` | Field with the booking's start time. | `{{components.schedule1.startField}}` |
| `endField` | Field with the booking's end time. | `{{components.schedule1.endField}}` |
| `titleField` | Field shown as the booking's title. | `{{components.schedule1.titleField}}` |
| `subtitleField` | Field shown as a second line on the booking when there is room. | `{{components.schedule1.subtitleField}}` |
| `statusField` | Field whose value colors the booking. Common words such as `Confirmed` or `Pending` get a matching tone, and a status containing `cancel` is struck through. | `{{components.schedule1.statusField}}` |
| `idField` | Field that identifies each booking. It fills **selectedBookingId** when the user clicks a booking. | `{{components.schedule1.idField}}` |
| `scale` | **Hours** shows the hours of one day across; **Days** shows a run of days. | `{{components.schedule1.scale}}` |
| `date` | Date to show, or the first day in the **Days** view. Leave empty for today. | `{{components.schedule1.date}}` |
| `dayStart` | Hour the **Hours** view starts at, such as `8` or `09:00`. | `{{components.schedule1.dayStart}}` |
| `dayEnd` | Hour the **Hours** view ends at, such as `18` or `18:00`. | `{{components.schedule1.dayEnd}}` |
| `slotMinutes` | Length in minutes of each clickable slot in the **Hours** view. | `{{components.schedule1.slotMinutes}}` |
| `days` | Number of days shown in the **Days** view. | `{{components.schedule1.days}}` |
| `hourFormat` | Whether times show on a 12-hour or 24-hour clock. | `{{components.schedule1.hourFormat}}` |
| `resourceTitle` | Heading of the resource column, such as `Room` or `Driver`. | `{{components.schedule1.resourceTitle}}` |
| `resourceWidth` | Width of the resource column in pixels. | `{{components.schedule1.resourceWidth}}` |
| `rowHeight` | Height of each resource row in pixels. Rows with overlapping bookings grow to fit them. | `{{components.schedule1.rowHeight}}` |
| `showNowLine` | Draws a line at the current time. | `{{components.schedule1.showNowLine}}` |
| `highlightSelected` | Marks the booking or slot the user clicked last. | `{{components.schedule1.highlightSelected}}` |
| `emptyText` | Message shown when there are no resources. | `{{components.schedule1.emptyText}}` |
| `statusColors` | A color for each status word, for example `{ "on site": "#0ea5e9" }`. Overrides the automatic tone. | `{{components.schedule1.statusColors}}` |
| `loadingIndicator` | What shows while the schedule is loading: a spinner or a skeleton outline. | `{{components.schedule1.loadingIndicator}}` |
| `selectedBooking` | The data row of the booking the user clicked last. | `{{components.schedule1.selectedBooking}}` |
| `selectedBookingId` | The id of the clicked booking, from **Id field**. | `{{components.schedule1.selectedBookingId}}` |
| `selectedSlot` | The slot the user clicked last: `resourceId`, `resource`, `start`, `end`, `date`, `startTime`, `endTime` and a readable `label`. | `{{components.schedule1.selectedSlot}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | Theme: Surface 1 |
| Grid line color | Theme: Default border |
| Label color | Theme: Placeholder text |
| Booking accent (bookings without a status, the selection) | Theme: Brand primary |
| Current time line color | `var(--cc-error-systemStatus)` |
| Radius | — |
