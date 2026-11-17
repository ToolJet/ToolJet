---
id: separator
title: Separator
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Separator** component draws a thin line to divide sections of a page or form, optionally with a short label in the middle such as `or`.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Orientation | Whether the line runs across or up and down. | `horizontal`, `vertical`. Default: `horizontal` |
| Label | Text shown in the middle of a horizontal line. Not shown on a vertical line. | Text |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `orientation` | Whether the line runs across or up and down. | `{{components.separator1.orientation}}` |
| `label` | Text shown in the middle of a horizontal line. Not shown on a vertical line. | `{{components.separator1.label}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Line | Theme: Default border |
| Thickness | `1` |
