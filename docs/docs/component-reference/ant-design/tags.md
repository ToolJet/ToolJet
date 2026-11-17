---
id: tags
title: Tags
---

<div className="badge badge--primary">Ant Design</div>

The **Tags** component shows a row of colored tags, such as skills, labels or categories. Common status words get matching colors, and users can click a tag.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tags | The tags, as text or as `{ label, color }` objects, such as `['Design', 'Urgent']`. | Array. Default: `["Design", "Frontend", "Urgent"]` |
| Tag colors | Colors for tag labels, such as `{ "Paid": "green", "Urgent": "red" }`. Without one, words such as Paid or Overdue get a matching status color. | Object |
| Variant | Look of the tags. `filled` has a light tint, `outlined` adds a border, and `solid` fills each tag with its full color. | `filled`, `outlined`, `solid`. Default: `filled` |
| Overflow | What happens when the tags don't fit on one line. `wrap` moves them to new lines, `single` keeps one line and hides the rest, and `scroll` keeps one line that scrolls sideways. | `wrap`, `single`, `scroll`. Default: `wrap` |
| Round | Gives the tags fully rounded ends. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On tag clicked](../common-settings.md#events) | Triggers when the user clicks a tag, or presses Enter or Space on it. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `tags` | The tags, as text or as `{ label, color }` objects, such as `['Design', 'Urgent']`. | `{{components.tags1.tags}}` |
| `tagColors` | Colors for tag labels, such as `{ "Paid": "green", "Urgent": "red" }`. Without one, words such as Paid or Overdue get a matching status color. | `{{components.tags1.tagColors}}` |
| `variant` | Look of the tags. `filled` has a light tint, `outlined` adds a border, and `solid` fills each tag with its full color. | `{{components.tags1.variant}}` |
| `overflow` | What happens when the tags don't fit on one line. `wrap` moves them to new lines, `single` keeps one line and hides the rest, and `scroll` keeps one line that scrolls sideways. | `{{components.tags1.overflow}}` |
| `round` | Gives the tags fully rounded ends. | `{{components.tags1.round}}` |
| `lastClickedTag` | Label of the tag the user clicked last. | `{{components.tags1.lastClickedTag}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
