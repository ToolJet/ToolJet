---
id: card
title: Card
---

<div className="badge badge--primary">Ant Design</div>

The **Card** component is a bordered box with a title that holds other components, such as a form section or a group of related figures.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Heading at the top of the card. Leave it empty for no header. | Text. Default: `Card title` |
| Extra | Text shown at the right of the title. | Text |
| Variant | `outlined` draws a border around the card; `borderless` uses a plain background. | `outlined`, `borderless`. Default: `outlined` |
| Size | `small` uses a shorter header and less padding. | `default`, `small`. Default: `default` |
| Hoverable | Raises the card with a shadow when the pointer is over it. | On or off. Default: Off |

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
| On click | Triggers when the user clicks anywhere on the card. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.card1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.card1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.card1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | Heading at the top of the card. Leave it empty for no header. | `{{components.card1.title}}` |
| `extra` | Text shown at the right of the title. | `{{components.card1.extra}}` |
| `variant` | `outlined` draws a border around the card; `borderless` uses a plain background. | `{{components.card1.variant}}` |
| `size` | `small` uses a shorter header and less padding. | `{{components.card1.size}}` |
| `hoverable` | Raises the card with a shadow when the pointer is over it. | `{{components.card1.hoverable}}` |
| `isVisible` | Whether the component is visible. | `{{components.card1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.card1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.card1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
