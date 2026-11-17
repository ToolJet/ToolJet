---
id: timeline
title: Timeline
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Timeline** component shows a vertical list of events in order, each with a title, description, time and a colored marker, such as an order's history, an activity feed or an audit trail.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On item clicked](../common-settings.md#events) | Triggers when the user clicks an event. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Clear selection | Clears **selectedItem**. | `components.timeline1.clearSelection()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Marker color (items without status) | Theme: Brand primary |
| Connecting line color | Theme: Default border |
| Title color | Theme: Primary text |
| Description color | Theme: Placeholder text |
| Time color | Theme: Placeholder text |
| Accent (current items) | Theme: Brand primary |
