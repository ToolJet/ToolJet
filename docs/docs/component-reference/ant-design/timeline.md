---
id: timeline
title: Timeline
---

<div className="badge badge--primary">Ant Design</div>

The **Timeline** component is Ant Design's timeline. It lists events in order along a line, such as an order's history or an audit trail.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The events, each with its text in `children`, an optional `label` such as a time, and an optional dot `color`, such as `[{ children: 'Order placed', label: '09:12', color: 'blue' }]`. | Array |
| Mode | Which side of the line the events sit on. `alternate` switches sides from one event to the next. | `left`, `alternate`, `right`. Default: `left` |
| Pending | Text for a last event still in progress, shown with a spinning dot. | Text |
| Reverse | Shows the events in reverse order. | On or off. Default: Off |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The events, each with its text in `children`, an optional `label` such as a time, and an optional dot `color`, such as `[{ children: 'Order placed', label: '09:12', color: 'blue' }]`. | `{{components.timeline1.items}}` |
| `mode` | Which side of the line the events sit on. `alternate` switches sides from one event to the next. | `{{components.timeline1.mode}}` |
| `pending` | Text for a last event still in progress, shown with a spinning dot. | `{{components.timeline1.pending}}` |
| `reverse` | Shows the events in reverse order. | `{{components.timeline1.reverse}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
