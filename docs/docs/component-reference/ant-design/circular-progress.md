---
id: circular-progress
title: Circular Progress
---

<div className="badge badge--primary">Ant Design</div>

The **Circular Progress** component shows a percentage as a ring, such as how much of a task or a quota is done.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Percent | How full the ring is, from 0 to 100. | Number. Default: `75` |
| Size (px) | Width and height of the ring, from 32 to 400 pixels. It shrinks to fit a smaller box. | Number. Default: `120` |
| Stroke width | Thickness of the ring, as a percent of its size. | Number. Default: `6` |
| Line cap | Shape of the ends of the filled part: `round` or square (`butt`). | `round`, `butt`. Default: `round` |
| Type | `circle` is a full ring; `dashboard` is a ring with a gap at the bottom, like a gauge. | `circle`, `dashboard`. Default: `circle` |
| Center | What shows in the middle: the `percent`, your own **Text** (`custom`) or nothing (`none`). | `percent`, `custom`, `none`. Default: `percent` |
| Text | Text shown in the middle when **Center** is `custom`. | Text |
| Label | Caption shown under the ring. | Text |
| Status | Color of the ring. `success` is green and `exception` is red; with **Center** set to `percent` they show a check or a cross in place of the number. | `normal`, `success`, `exception`, `active`. Default: `normal` |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set percent | Changes how full the ring is, from 0 to 100. | `components.circularprogress1.setPercent("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `percent` | How full the ring is, from 0 to 100. | `{{components.circularprogress1.percent}}` |
| `size` | Width and height of the ring, from 32 to 400 pixels. It shrinks to fit a smaller box. | `{{components.circularprogress1.size}}` |
| `strokeWidth` | Thickness of the ring, as a percent of its size. | `{{components.circularprogress1.strokeWidth}}` |
| `strokeLinecap` | Shape of the ends of the filled part: `round` or square (`butt`). | `{{components.circularprogress1.strokeLinecap}}` |
| `type` | `circle` is a full ring; `dashboard` is a ring with a gap at the bottom, like a gauge. | `{{components.circularprogress1.type}}` |
| `format` | What shows in the middle: the `percent`, your own **Text** (`custom`) or nothing (`none`). | `{{components.circularprogress1.format}}` |
| `text` | Text shown in the middle when **Center** is `custom`. | `{{components.circularprogress1.text}}` |
| `label` | Caption shown under the ring. | `{{components.circularprogress1.label}}` |
| `status` | Color of the ring. `success` is green and `exception` is red; with **Center** set to `percent` they show a check or a cross in place of the number. | `{{components.circularprogress1.status}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
