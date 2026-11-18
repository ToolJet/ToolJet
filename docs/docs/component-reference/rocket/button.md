---
id: button
title: Button
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Button** component runs an action when it is clicked, such as submitting a form, running a query or opening another page. Inside a **Form**, a click on its submit button submits the form first.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown on the button. | Text. Default: `Button` |
| Variant | Overall look of the button. **Destructive** is red for actions that delete or remove data; **Link** looks like a text link. | Default, Secondary, Outline, Ghost, Destructive, Link. Default: Default |
| Size | Height and text size of the button. | Sm, Default, Lg. Default: Default |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On click | Triggers when the user clicks the button. |
| On hover | Triggers when the pointer moves onto the button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Clicks the button, which fires its **On click** event. | `components.button1.click()` |
| Set text | Changes the button's label until the **Label** property changes. | `components.button1.setText("New text")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.button1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.button1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.button1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text shown on the button. | `{{components.button1.text}}` |
| `variant` | Overall look of the button. **Destructive** is red for actions that delete or remove data; **Link** looks like a text link. | `{{components.button1.variant}}` |
| `size` | Height and text size of the button. | `{{components.button1.size}}` |
| `buttonText` | The text the button shows now, including a label set with **Set text**. | `{{components.button1.buttonText}}` |
| `isVisible` | Whether the component is visible. | `{{components.button1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.button1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.button1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Button background | Theme: Brand primary |
| Button hover background | Theme: Brand primary |
| Button text color | Theme: Surface 1 |
| Button border color | `transparent` |
| Button radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
