---
id: timeline
title: Timeline
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Timeline** component shows a vertical list of events in order, each with a title, description, time and a colored marker, such as an order's history, an activity feed or an audit trail.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | Events to show, each with a `title`, and optionally a `description`, `time`, `status`, `color` and `icon`. A status such as `done`, `pending`, `error` or `current` colors the marker. | Array |
| Marker | Marker for each event: a small **Dot** or the event's **Icon** in a circle. | Dot, Icon. Default: Dot |
| Density | Spacing between events. | Comfortable, Compact. Default: Comfortable |
| Newest first (reverse) | Shows the events in reverse order, so the last item in **Items** comes first. | On or off. Default: Off |
| Time | Whether each event's time shows to the **Right** of the title or on **Top** of it. | Right, Top. Default: Right |
| Date format for ISO times (empty: as given) | Format for times given as ISO dates, such as `MMM D, h:mm A`. Leave empty to show times as given. | Text |
| Colours by status | A color for each status word, for example `{ "shipped": "#16a34a" }`. Overrides the theme's colors. | Object |
| Loading look | What shows while the component is loading: a spinner or a skeleton timeline. | Spinner, Skeleton. Default: Spinner |

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
| On item clicked | Triggers when the user clicks an event. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear selection | Clears **selectedItem**. | `components.timeline1.clearSelection()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.timeline1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.timeline1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.timeline1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | Events to show, each with a `title`, and optionally a `description`, `time`, `status`, `color` and `icon`. A status such as `done`, `pending`, `error` or `current` colors the marker. | `{{components.timeline1.items}}` |
| `marker` | Marker for each event: a small **Dot** or the event's **Icon** in a circle. | `{{components.timeline1.marker}}` |
| `density` | Spacing between events. | `{{components.timeline1.density}}` |
| `newestFirst` | Shows the events in reverse order, so the last item in **Items** comes first. | `{{components.timeline1.newestFirst}}` |
| `timePosition` | Whether each event's time shows to the **Right** of the title or on **Top** of it. | `{{components.timeline1.timePosition}}` |
| `dateFormat` | Format for times given as ISO dates, such as `MMM D, h:mm A`. Leave empty to show times as given. | `{{components.timeline1.dateFormat}}` |
| `statusColors` | A color for each status word, for example `{ "shipped": "#16a34a" }`. Overrides the theme's colors. | `{{components.timeline1.statusColors}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or a skeleton timeline. | `{{components.timeline1.loadingIndicator}}` |
| `lastClickedItem` | The event the user clicked last. It is kept when the selection is cleared. | `{{components.timeline1.lastClickedItem}}` |
| `selectedItem` | The selected event, or an empty object after **Clear selection** runs or when the event leaves **Items**. | `{{components.timeline1.selectedItem}}` |
| `isVisible` | Whether the component is visible. | `{{components.timeline1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.timeline1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.timeline1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Marker color (items without status) | Theme: Brand primary |
| Connecting line color | Theme: Default border |
| Title color | Theme: Primary text |
| Description color | Theme: Placeholder text |
| Time color | Theme: Placeholder text |
| Accent (current items) | Theme: Brand primary |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
