---
id: text
title: Text
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Text** component shows a line or paragraph of plain text, such as a description, an instruction or a value from a query.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text to show. | Text. Default: `Text` |
| Style | Preset look of the text. **Lead** is larger for an intro, **Muted** is gray for secondary notes, and **Small** and **Large** change the size. | Paragraph, Lead, Muted, Small, Large. Default: Paragraph |
| Loading look | What shows while the component is loading: a spinner or skeleton lines. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the text. |
| [On hover](../common-settings.md#events) | Triggers when the pointer moves onto the text. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Changes the text shown until the **Text** property changes. | `components.text1.setText("New text")` |
| Clear | Empties the text. | `components.text1.clear()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text to show. | `{{components.text1.text}}` |
| `tone` | Preset look of the text. **Lead** is larger for an intro, **Muted** is gray for secondary notes, and **Small** and **Large** change the size. | `{{components.text1.tone}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or skeleton lines. | `{{components.text1.loadingIndicator}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Text color | Theme: Primary text |
| Text alignment (left, center, right) | `left` |
| Typeface | Theme font |
| Weight | — |
| Letter spacing (px, or em like 0.12em) | — |
| Casing | As typed |
| Font size (px) | — |
