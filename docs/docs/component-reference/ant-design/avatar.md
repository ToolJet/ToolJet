---
id: avatar
title: Avatar
---

<div className="badge badge--primary">Ant Design</div>

The **Avatar** component shows a user's picture, or their initials when there is no picture, for example next to a name in a profile or a list.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Src | URL of the image to show. | Text |
| Text | Text shown when there is no image. A full name with a space shows its initials, such as `AL` for Ada Lovelace. | Text. Default: `AL` |
| Alt | Alternative text for the image, read by screen readers. When empty, **Text** is used. | Text |
| Shape | Whether the avatar is round or a square with rounded corners. | `circle`, `square`. Default: `circle` |
| Size (px) | Width and height of the avatar, from 16 to 240 pixels. It shrinks to fit a smaller box. | Number. Default: `40` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `src` | URL of the image to show. | `{{components.avatar1.src}}` |
| `children` | Text shown when there is no image. A full name with a space shows its initials, such as `AL` for Ada Lovelace. | `{{components.avatar1.children}}` |
| `alt` | Alternative text for the image, read by screen readers. When empty, **Text** is used. | `{{components.avatar1.alt}}` |
| `shape` | Whether the avatar is round or a square with rounded corners. | `{{components.avatar1.shape}}` |
| `size` | Width and height of the avatar, from 16 to 240 pixels. It shrinks to fit a smaller box. | `{{components.avatar1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
