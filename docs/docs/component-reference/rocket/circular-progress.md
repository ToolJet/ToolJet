---
id: circular-progress
title: Circular Progress
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Circular Progress** component shows progress as a ring that fills from `0` to `100`, such as the share of orders shipped or a task's completion.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Value (0 to 100) | How full the ring is, from `0` to `100`. | Number. Default: `63` |
| Size (px) | Width and height of the ring, in pixels. The ring shrinks if its box is smaller. | Number. Default: `96` |
| Thickness (px) | Width of the ring's line, in pixels. | Number. Default: `8` |
| Ends | Shape of the ends of the filled part: **Round** or **Flat**. | Round, Flat. Default: Round |
| Centre text | What appears in the middle of the ring: **Value** shows the percentage, **Custom** shows **Custom centre text**, and **None** shows nothing. | Value, Custom, None. Default: Value |
| Custom centre text | Text shown in the middle of the ring when **Centre text** is **Custom**. | Text |
| Sub-label | Smaller text shown under the centre text, such as `Complete`. | Text. Default: `Complete` |
| Loading look | What the component shows while it is loading: a **Spinner** or a **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set value | Sets how full the ring is to **Value**, kept between `0` and `100`. | `components.circularprogress1.setValue("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `value` | How full the ring is, from `0` to `100`. | `{{components.circularprogress1.value}}` |
| `size` | Width and height of the ring, in pixels. The ring shrinks if its box is smaller. | `{{components.circularprogress1.size}}` |
| `thickness` | Width of the ring's line, in pixels. | `{{components.circularprogress1.thickness}}` |
| `lineCap` | Shape of the ends of the filled part: **Round** or **Flat**. | `{{components.circularprogress1.lineCap}}` |
| `centerText` | What appears in the middle of the ring: **Value** shows the percentage, **Custom** shows **Custom centre text**, and **None** shows nothing. | `{{components.circularprogress1.centerText}}` |
| `text` | Text shown in the middle of the ring when **Centre text** is **Custom**. | `{{components.circularprogress1.text}}` |
| `label` | Smaller text shown under the centre text, such as `Complete`. | `{{components.circularprogress1.label}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a **Skeleton** placeholder. | `{{components.circularprogress1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Bar color | Theme: Brand primary |
| Track color | Theme: Brand primary |
| Centre text color | Theme: Primary text |
| Sub-label color | Theme: Placeholder text |
| Alignment | Center |
