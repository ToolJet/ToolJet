---
id: empty
title: Empty
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Empty** component shows an icon, a title and a short message for a place with nothing to show yet, such as a search with no results or a list with no records. It can also show a button that starts the next step.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | The main message, for example `No orders yet`. | Text. Default: `No results` |
| Description | A second line under the title that explains what to do next. | Text |
| Icon | Icon shown above the title. | Text. Default: `inbox` |
| Action label | Text on the button under the message. Leave it empty to hide the button. | Text |
| Loading look | What the component shows while it is loading: a spinner or a skeleton placeholder. | Spinner, Skeleton. Default: Spinner |

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
| On action clicked | Triggers when the user clicks the action button. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.empty1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.empty1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.empty1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | The main message, for example `No orders yet`. | `{{components.empty1.title}}` |
| `description` | A second line under the title that explains what to do next. | `{{components.empty1.description}}` |
| `icon` | Icon shown above the title. | `{{components.empty1.icon}}` |
| `actionLabel` | Text on the button under the message. Leave it empty to hide the button. | `{{components.empty1.actionLabel}}` |
| `loadingIndicator` | What the component shows while it is loading: a spinner or a skeleton placeholder. | `{{components.empty1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.empty1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.empty1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.empty1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | `transparent` |
| Dashed border color | Theme: Default border |
| Radius | — |
| Icon background | Theme: Surface 3 |
| Icon color | Theme: Placeholder text |
| Title color | Theme: Primary text |
| Description color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
