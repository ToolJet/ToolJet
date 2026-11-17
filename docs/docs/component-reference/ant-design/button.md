---
id: button
title: Button
---

<div className="badge badge--primary">Ant Design</div>

An Ant Design button that runs an action when clicked, such as submitting a form, running a query or opening a link.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable and Loading, the matching actions, and Devices. They are not repeated here.
:::

## Properties

| Property | Values | Default |
|:--|:--|:--|
| Text | Text | `Button` |
| Color | `primary`, `default`, `danger` | `primary` |
| Variant | `solid`, `outlined`, `dashed`, `filled`, `text`, `link` | `solid` |
| Size | `small`, `middle`, `large` | `middle` |
| Shape | `default`, `round` | `default` |
| Block | On or off | On |
| Href | Text | — |
| Target | `_self`, `_blank` | `_blank` |

## Events

| Event | Fires when |
|:--|:--|
| [On click](../common-settings.md#events) | The user clicks the component. |

## Component Actions

Run these from an event handler with **Control Component**, or from a RunJS query.

| Action | Parameters | How to call it |
|:--|:--|:--|
| Click | — | `components.button1.click()` |
| Focus | — | `components.button1.focus()` |

## Exposed Variables

| Variable | Holds | How to read it |
|:--|:--|:--|
| `children` | The Text property. | `{{components.button1.children}}` |
| `color` | The Color property. | `{{components.button1.color}}` |
| `variant` | The Variant property. | `{{components.button1.variant}}` |
| `size` | The Size property. | `{{components.button1.size}}` |
| `shape` | The Shape property. | `{{components.button1.shape}}` |
| `block` | The Block property. | `{{components.button1.block}}` |
| `href` | The Href property. | `{{components.button1.href}}` |
| `target` | The Target property. | `{{components.button1.target}}` |

## Styles

| Style | Default |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
