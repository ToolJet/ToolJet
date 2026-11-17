---
id: timeline
title: Timeline
---

<div className="badge badge--primary">Ant Design</div>

The **Timeline** component is Ant Design's timeline. It lists events in order along a line, such as an order's history or an audit trail.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The events, each with its text in `children`, an optional `label` such as a time, and an optional dot `color`, such as `[{ children: 'Order placed', label: '09:12', color: 'blue' }]`. | Array |
| Mode | Which side of the line the events sit on. `alternate` switches sides from one event to the next. | `left`, `alternate`, `right`. Default: `left` |
| Pending | Text for a last event still in progress, shown with a spinning dot. | Text |
| Reverse | Shows the events in reverse order. | On or off. Default: Off |

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

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.timeline1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.timeline1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.timeline1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The events, each with its text in `children`, an optional `label` such as a time, and an optional dot `color`, such as `[{ children: 'Order placed', label: '09:12', color: 'blue' }]`. | `{{components.timeline1.items}}` |
| `mode` | Which side of the line the events sit on. `alternate` switches sides from one event to the next. | `{{components.timeline1.mode}}` |
| `pending` | Text for a last event still in progress, shown with a spinning dot. | `{{components.timeline1.pending}}` |
| `reverse` | Shows the events in reverse order. | `{{components.timeline1.reverse}}` |
| `isVisible` | Whether the component is visible. | `{{components.timeline1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.timeline1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.timeline1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
