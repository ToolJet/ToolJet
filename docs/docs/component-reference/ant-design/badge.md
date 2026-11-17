---
id: badge
title: Badge
---

<div className="badge badge--primary">Ant Design</div>

The **Badge** component shows a small status dot with a label, such as Pending or Active, or a count bubble for things like unread items.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Status | Color of the dot. `processing` is blue and pulses, `default` is gray. | `default`, `processing`, `success`, `warning`, `error`. Default: `default` |
| Text | Label shown next to the dot or the count. | Text. Default: `Pending` |
| Count | A number to show in a bubble in place of the status dot. Leave it empty to show the dot. | Number |
| Overflow count | Highest number the count bubble shows. Larger counts show as this number with a plus, such as `99+`. | Number. Default: `99` |
| Color | A color name such as `blue` or any CSS color for the dot or bubble. It overrides **Status**. | Text |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `status` | Color of the dot. `processing` is blue and pulses, `default` is gray. | `{{components.badge1.status}}` |
| `text` | Label shown next to the dot or the count. | `{{components.badge1.text}}` |
| `count` | A number to show in a bubble in place of the status dot. Leave it empty to show the dot. | `{{components.badge1.count}}` |
| `overflowCount` | Highest number the count bubble shows. Larger counts show as this number with a plus, such as `99+`. | `{{components.badge1.overflowCount}}` |
| `color` | A color name such as `blue` or any CSS color for the dot or bubble. It overrides **Status**. | `{{components.badge1.color}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
