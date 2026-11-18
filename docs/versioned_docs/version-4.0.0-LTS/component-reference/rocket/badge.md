---
id: badge
title: Badge
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Badge** component shows a short label in a small pill, such as a status, a tag or a count.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown in the badge. | Text. Default: `Badge` |
| Variant | Color of the badge. `success`, `warning` and `destructive` use the theme's status colors; `outline` has a border and no fill. | `default`, `secondary`, `outline`, `success`, `warning`, `destructive`. Default: `default` |
| Alignment | Where the badge sits across the component's width: left, center or right. | Left, Center, Right. Default: Left |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks the badge. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.badge1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.badge1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.badge1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `text` | Text shown in the badge. | `{{components.badge1.text}}` |
| `variant` | Color of the badge. `success`, `warning` and `destructive` use the theme's status colors; `outline` has a border and no fill. | `{{components.badge1.variant}}` |
| `align` | Where the badge sits across the component's width: left, center or right. | `{{components.badge1.align}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | `{{components.badge1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.badge1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.badge1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.badge1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Badge background | Theme: Brand primary |
| Badge text color | Theme: Surface 1 |
| Badge border color | `transparent` |
| Badge radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
