---
id: tags
title: Tags
---

<div className="badge badge--primary">Ant Design</div>

The **Tags** component shows a row of colored tags, such as skills, labels or categories. Common status words get matching colors, and users can click a tag.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tags | The tags, as text or as `{ label, color }` objects, such as `['Design', 'Urgent']`. | Array. Default: `["Design", "Frontend", "Urgent"]` |
| Tag colors | Colors for tag labels, such as `{ "Paid": "green", "Urgent": "red" }`. Without one, words such as Paid or Overdue get a matching status color. | Object |
| Variant | Look of the tags. `filled` has a light tint, `outlined` adds a border, and `solid` fills each tag with its full color. | `filled`, `outlined`, `solid`. Default: `filled` |
| Overflow | What happens when the tags don't fit on one line. `wrap` moves them to new lines, `single` keeps one line and hides the rest, and `scroll` keeps one line that scrolls sideways. | `wrap`, `single`, `scroll`. Default: `wrap` |
| Round | Gives the tags fully rounded ends. | On or off. Default: Off |

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
| On tag clicked | Triggers when the user clicks a tag, or presses Enter or Space on it. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.tags1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.tags1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.tags1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `tags` | The tags, as text or as `{ label, color }` objects, such as `['Design', 'Urgent']`. | `{{components.tags1.tags}}` |
| `tagColors` | Colors for tag labels, such as `{ "Paid": "green", "Urgent": "red" }`. Without one, words such as Paid or Overdue get a matching status color. | `{{components.tags1.tagColors}}` |
| `variant` | Look of the tags. `filled` has a light tint, `outlined` adds a border, and `solid` fills each tag with its full color. | `{{components.tags1.variant}}` |
| `overflow` | What happens when the tags don't fit on one line. `wrap` moves them to new lines, `single` keeps one line and hides the rest, and `scroll` keeps one line that scrolls sideways. | `{{components.tags1.overflow}}` |
| `round` | Gives the tags fully rounded ends. | `{{components.tags1.round}}` |
| `lastClickedTag` | Label of the tag the user clicked last. | `{{components.tags1.lastClickedTag}}` |
| `isVisible` | Whether the component is visible. | `{{components.tags1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.tags1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.tags1.isDisabled}}` |

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
