---
id: divider
title: Divider
---

<div className="badge badge--primary">Ant Design</div>

The **Divider** component draws a line that separates sections of a page, with optional text in the line.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown in the line. Only a horizontal divider shows text. | Text |
| Orientation | Where the text sits along the line. | `left`, `center`, `right`. Default: `center` |
| Dashed | Draws a dashed line instead of a solid one. | On or off. Default: Off |
| Plain | Shows the text in normal weight and a smaller size. Turn it off for bold, heading-style text. | On or off. Default: On |
| Type | `horizontal` draws a line across the box; `vertical` draws a line from top to bottom, for separating items in a row. | `horizontal`, `vertical`. Default: `horizontal` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown in the line. Only a horizontal divider shows text. | `{{components.divider1.children}}` |
| `orientation` | Where the text sits along the line. | `{{components.divider1.orientation}}` |
| `dashed` | Draws a dashed line instead of a solid one. | `{{components.divider1.dashed}}` |
| `plain` | Shows the text in normal weight and a smaller size. Turn it off for bold, heading-style text. | `{{components.divider1.plain}}` |
| `type` | `horizontal` draws a line across the box; `vertical` draws a line from top to bottom, for separating items in a row. | `{{components.divider1.type}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
