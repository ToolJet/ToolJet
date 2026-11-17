---
id: heading
title: Heading
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Heading** component shows a title for a page or section of an app. Text that doesn't fit its box ends in an ellipsis, with the full text on hover.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown in the heading. | Text. Default: `Heading` |
| Level | Heading level, from `H1` (largest) to `H4`. It also sets the font size unless **Font size** is changed. | H1, H2, H3, H4. Default: H2 |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the heading. |
| [On hover](../common-settings.md#events) | Triggers when the pointer moves onto the heading. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Changes the heading's text to **Text**. | `components.heading1.setText("New text")` |
| Clear | Empties the heading's text. | `components.heading1.clear()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text shown in the heading. | `{{components.heading1.text}}` |
| `level` | Heading level, from `H1` (largest) to `H4`. It also sets the font size unless **Font size** is changed. | `{{components.heading1.level}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.heading1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Heading color | Theme: Primary text |
| Text alignment (left, center, right) | `left` |
| Typeface | Theme font |
| Weight | — |
| Letter spacing (px, or em like 0.12em) | — |
| Casing | As typed |
| Font size (px; default from the level) | — |
