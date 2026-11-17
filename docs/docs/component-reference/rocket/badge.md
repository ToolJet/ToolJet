---
id: badge
title: Badge
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Badge** component shows a short label in a small pill, such as a status, a tag or a count.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown in the badge. | Text. Default: `Badge` |
| Variant | Color of the badge. `success`, `warning` and `destructive` use the theme's status colors; `outline` has a border and no fill. | `default`, `secondary`, `outline`, `success`, `warning`, `destructive`. Default: `default` |
| Alignment | Where the badge sits across the component's width: left, center or right. | Left, Center, Right. Default: Left |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the badge. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text shown in the badge. | `{{components.badge1.text}}` |
| `variant` | Color of the badge. `success`, `warning` and `destructive` use the theme's status colors; `outline` has a border and no fill. | `{{components.badge1.variant}}` |
| `align` | Where the badge sits across the component's width: left, center or right. | `{{components.badge1.align}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | `{{components.badge1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Badge background | Theme: Brand primary |
| Badge text color | Theme: Surface 1 |
| Badge border color | `transparent` |
| Badge radius | — |
