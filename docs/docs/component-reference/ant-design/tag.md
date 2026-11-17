---
id: tag
title: Tag
---

<div className="badge badge--primary">Ant Design</div>

The **Tag** component is Ant Design's tag. It shows a short colored label, such as a status, a category or a priority, and can be closed by the user.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown in the tag. | Text. Default: `Tag` |
| Color | Color of the tag. Use a status (`success`, `processing`, `warning`, `error`), a palette name such as `blue`, `gold`, `purple` or `volcano`, or any CSS color such as `#87d068`. | Text. Default: `default` |
| Bordered | Draws a border around the tag. | On or off. Default: On |
| Closable | Shows a close icon. Clicking it hides the tag until the **Reopen** action runs. | On or off. Default: Off |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On close | Triggers when the user closes the tag with its close icon. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Reopen | Shows a tag the user closed. | `components.tag1.reopen()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.tag1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.tag1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.tag1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown in the tag. | `{{components.tag1.children}}` |
| `color` | Color of the tag. Use a status (`success`, `processing`, `warning`, `error`), a palette name such as `blue`, `gold`, `purple` or `volcano`, or any CSS color such as `#87d068`. | `{{components.tag1.color}}` |
| `bordered` | Draws a border around the tag. | `{{components.tag1.bordered}}` |
| `closable` | Shows a close icon. Clicking it hides the tag until the **Reopen** action runs. | `{{components.tag1.closable}}` |
| `closed` | `true` after the user closes the tag, until **Reopen** runs. | `{{components.tag1.closed}}` |
| `isVisible` | Whether the component is visible. | `{{components.tag1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.tag1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.tag1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
