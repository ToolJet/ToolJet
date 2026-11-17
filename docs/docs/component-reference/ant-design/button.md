---
id: button
title: Button
---

<div className="badge badge--primary">Ant Design</div>

The **Button** component is Ant Design's button. It runs an action when clicked, such as submitting a form or running a query, or opens a link when **Href** is set.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown on the button. | Text. Default: `Button` |
| Color | Color of the button. Use `danger` for actions that delete or remove data. | `primary`, `default`, `danger`. Default: `primary` |
| Variant | Fill style. `solid` is filled, `outlined` and `dashed` have a border, `filled` has a light fill, and `text` and `link` have no border. | `solid`, `outlined`, `dashed`, `filled`, `text`, `link`. Default: `solid` |
| Size | Height and text size of the button. | `small`, `middle`, `large`. Default: `middle` |
| Shape | `round` gives the button fully rounded ends. | `default`, `round`. Default: `default` |
| Block | Makes the button fill the width of its box. | On or off. Default: On |
| Href | A URL to open when the button is clicked. The button then behaves as a link. | Text |
| Target | Where **Href** opens: `_blank` for a new tab, `_self` for the same tab. | `_self`, `_blank`. Default: `_blank` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Clicks the button, which fires its **On click** event. | `components.button1.click()` |
| Focus | Moves keyboard focus to the button. | `components.button1.focus()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown on the button. | `{{components.button1.children}}` |
| `color` | Color of the button. Use `danger` for actions that delete or remove data. | `{{components.button1.color}}` |
| `variant` | Fill style. `solid` is filled, `outlined` and `dashed` have a border, `filled` has a light fill, and `text` and `link` have no border. | `{{components.button1.variant}}` |
| `size` | Height and text size of the button. | `{{components.button1.size}}` |
| `shape` | `round` gives the button fully rounded ends. | `{{components.button1.shape}}` |
| `block` | Makes the button fill the width of its box. | `{{components.button1.block}}` |
| `href` | A URL to open when the button is clicked. The button then behaves as a link. | `{{components.button1.href}}` |
| `target` | Where **Href** opens: `_blank` for a new tab, `_self` for the same tab. | `{{components.button1.target}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
