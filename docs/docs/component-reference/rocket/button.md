---
id: button
title: Button
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Button** component runs an action when it is clicked, such as submitting a form, running a query or opening another page. Inside a **Form**, a click on its submit button submits the form first.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown on the button. | Text. Default: `Button` |
| Variant | Overall look of the button. **Destructive** is red for actions that delete or remove data; **Link** looks like a text link. | Default, Secondary, Outline, Ghost, Destructive, Link. Default: Default |
| Size | Height and text size of the button. | Sm, Default, Lg. Default: Default |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the button. |
| [On hover](../common-settings.md#events) | Triggers when the pointer moves onto the button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Clicks the button, which fires its **On click** event. | `components.button1.click()` |
| Set text | Changes the button's label until the **Label** property changes. | `components.button1.setText("New text")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text shown on the button. | `{{components.button1.text}}` |
| `variant` | Overall look of the button. **Destructive** is red for actions that delete or remove data; **Link** looks like a text link. | `{{components.button1.variant}}` |
| `size` | Height and text size of the button. | `{{components.button1.size}}` |
| `buttonText` | The text the button shows now, including a label set with **Set text**. | `{{components.button1.buttonText}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Button background | Theme: Brand primary |
| Button hover background | Theme: Brand primary |
| Button text color | Theme: Surface 1 |
| Button border color | `transparent` |
| Button radius | — |
