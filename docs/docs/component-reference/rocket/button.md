---
id: button
title: Button
---

<div className="badge badge--primary">Rocket 2.0</div>

A button that runs an action when clicked, such as submitting a form, running a query or opening another page.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable and Loading, the matching actions, and Devices. They are not repeated here.
:::

## Properties

| Property | Values | Default |
|:--|:--|:--|
| Label | Text | `Button` |
| Variant | Default, Secondary, Outline, Ghost, Destructive, Link | Default |
| Size | Sm, Default, Lg | Default |

## Events

| Event | Fires when |
|:--|:--|
| [On click](../common-settings.md#events) | The user clicks the component. |
| [On hover](../common-settings.md#events) | The pointer moves onto the component. |

## Component Actions

Run these from an event handler with **Control Component**, or from a RunJS query.

| Action | Parameters | How to call it |
|:--|:--|:--|
| Click | — | `components.button1.click()` |
| Set text | Text | `components.button1.setText("New text")` |

## Exposed Variables

| Variable | Holds | How to read it |
|:--|:--|:--|
| `text` | The Label property. | `{{components.button1.text}}` |
| `variant` | The Variant property. | `{{components.button1.variant}}` |
| `size` | The Size property. | `{{components.button1.size}}` |
| `buttonText` | The text the button shows now, including a label set with Set text. | `{{components.button1.buttonText}}` |

## Styles

| Style | Default |
|:--|:--|
| Button background | Theme: Brand primary |
| Button hover background | Theme: Brand primary |
| Button text color | Theme: Surface 1 |
| Button border color | `transparent` |
| Button radius | — |
