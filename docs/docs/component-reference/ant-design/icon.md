---
id: icon
title: Icon
---

<div className="badge badge--primary">Ant Design</div>

The **Icon** component shows a single icon, optionally on a tinted circle or square, such as a marker beside a heading or a clickable shortcut.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Icon | The icon to show, by its Ant Design name, such as `TeamOutlined`, or a plain word, such as `users`, `cart` or `rocket`. | Text. Default: `StarOutlined` |
| Size (px) | Size of the icon, from 8 to 200 pixels. | Number. Default: `20` |
| Type | Color of the icon. `muted` is a light gray; the others use the theme's colors. | `default`, `muted`, `primary`, `success`, `warning`, `danger`. Default: `default` |
| Chip | Puts the icon on a lightly tinted `circle` or `square` in the icon's color. | `none`, `circle`, `square`. Default: `none` |
| Chip size (px) | Width and height of the chip in pixels. It shrinks to fit a smaller box. | Number. Default: `40` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the icon. |
| [On hover](../common-settings.md#events) | Triggers when the pointer moves onto the icon. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Fires the icon's **On click** event. | `components.icon1.click()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `icon` | The icon to show, by its Ant Design name, such as `TeamOutlined`, or a plain word, such as `users`, `cart` or `rocket`. | `{{components.icon1.icon}}` |
| `size` | Size of the icon, from 8 to 200 pixels. | `{{components.icon1.size}}` |
| `type` | Color of the icon. `muted` is a light gray; the others use the theme's colors. | `{{components.icon1.type}}` |
| `chip` | Puts the icon on a lightly tinted `circle` or `square` in the icon's color. | `{{components.icon1.chip}}` |
| `chipSize` | Width and height of the chip in pixels. It shrinks to fit a smaller box. | `{{components.icon1.chipSize}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
