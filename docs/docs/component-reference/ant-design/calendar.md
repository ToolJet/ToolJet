---
id: calendar
title: Calendar
---

<div className="badge badge--primary">Ant Design</div>

The **Calendar** component shows a month of dates with events marked on their days, such as deadlines or releases. Users pick a date by clicking it.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Value | The selected date, as `YYYY-MM-DD`. It updates when the user picks a date. When empty, the calendar opens on today. | Text |
| Fullscreen | Shows a large month grid with event names in the cells. Turn it off for a small card calendar that marks events with dots. | On or off. Default: On |
| Events | Events to mark on the calendar, as a list of `{date, title, type}`. `type` sets the color: `success`, `warning`, `error` or `processing`. | Array |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the user picks a date, a month or a year. |
| [On panel change](../common-settings.md#events) | Triggers when the user moves to another month or year, or switches between the month and year views. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `value` | The selected date, as `YYYY-MM-DD`. It updates when the user picks a date. When empty, the calendar opens on today. | `{{components.calendar1.value}}` |
| `fullscreen` | Shows a large month grid with event names in the cells. Turn it off for a small card calendar that marks events with dots. | `{{components.calendar1.fullscreen}}` |
| `events` | Events to mark on the calendar, as a list of `{date, title, type}`. `type` sets the color: `success`, `warning`, `error` or `processing`. | `{{components.calendar1.events}}` |
| `panelDate` | A date in the month or year the calendar shows after the user changed it, as `YYYY-MM-DD`. | `{{components.calendar1.panelDate}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
