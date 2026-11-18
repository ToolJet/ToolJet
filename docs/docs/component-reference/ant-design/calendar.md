---
id: calendar
title: Calendar
---

<div className="badge badge--primary">Ant Design</div>

The **Calendar** component shows a month of dates with events marked on their days, such as deadlines or releases. Users pick a date by clicking it.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Value | The selected date, as `YYYY-MM-DD`. It updates when the user picks a date. When empty, the calendar opens on today. | Text |
| Fullscreen | Shows a large month grid with event names in the cells. Turn it off for a small card calendar that marks events with dots. | On or off. Default: On |
| Events | Events to mark on the calendar, as a list of `{date, title, type}`. `type` sets the color: `success`, `warning`, `error` or `processing`. | Array |

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
| On select | Triggers when the user picks a date, a month or a year. |
| On panel change | Triggers when the user moves to another month or year, or switches between the month and year views. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.calendar1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.calendar1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.calendar1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `value` | The selected date, as `YYYY-MM-DD`. It updates when the user picks a date. When empty, the calendar opens on today. | `{{components.calendar1.value}}` |
| `fullscreen` | Shows a large month grid with event names in the cells. Turn it off for a small card calendar that marks events with dots. | `{{components.calendar1.fullscreen}}` |
| `events` | Events to mark on the calendar, as a list of `{date, title, type}`. `type` sets the color: `success`, `warning`, `error` or `processing`. | `{{components.calendar1.events}}` |
| `panelDate` | A date in the month or year the calendar shows after the user changed it, as `YYYY-MM-DD`. | `{{components.calendar1.panelDate}}` |
| `isVisible` | Whether the component is visible. | `{{components.calendar1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.calendar1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.calendar1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
