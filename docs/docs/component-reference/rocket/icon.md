---
id: icon
title: Icon
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Icon** component shows a single icon, optionally on a colored chip. Use it to mark a status, label a metric or act as a small clickable control.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Icon | Icon to show, by its Lucide name, such as `trending-up` or `bell`. | Text. Default: `trending-up` |
| Icon size (px) | Size of the icon, in pixels. | Number. Default: `20` |
| Stroke width | Thickness of the icon's lines. | Number. Default: `2` |
| Tone (unless Icon color is set) | Color of the icon. It is ignored once **Icon color** is set. | `default`, `muted`, `primary`, `success`, `warning`, `destructive`. Default: `primary` |
| Background chip | Shape of the background behind the icon: **None**, **Circle** or **Rounded square**. | None, Circle, Rounded square. Default: Rounded square |
| Chip size (px, empty: icon x 2) | Size of the chip, in pixels. Leave it empty for twice the icon size. | Text |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

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
| `icon` | Icon to show, by its Lucide name, such as `trending-up` or `bell`. | `{{components.icon1.icon}}` |
| `size` | Size of the icon, in pixels. | `{{components.icon1.size}}` |
| `strokeWidth` | Thickness of the icon's lines. | `{{components.icon1.strokeWidth}}` |
| `tone` | Color of the icon. It is ignored once **Icon color** is set. | `{{components.icon1.tone}}` |
| `chip` | Shape of the background behind the icon: **None**, **Circle** or **Rounded square**. | `{{components.icon1.chip}}` |
| `chipSize` | Size of the chip, in pixels. Leave it empty for twice the icon size. | `{{components.icon1.chipSize}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.icon1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Icon color | Theme: Brand primary |
| Chip background (default: icon color tint) | Theme: Brand primary |
| Chip radius (square chip) | — |
| Alignment | `left` |
