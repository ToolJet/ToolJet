---
id: card
title: Card
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Card** component is a panel with a title and description that holds other components dropped into it. Use it to group related fields or figures on a page.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Heading shown at the top of the card. | Text. Default: `Card title` |
| Description | Text shown under the title. Leave it empty to hide it. | Text. Default: `Drop components into the area below.` |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

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
| `title` | Heading shown at the top of the card. | `{{components.card1.title}}` |
| `description` | Text shown under the title. Leave it empty to hide it. | `{{components.card1.description}}` |
| `isVisible` | Whether the component is visible. | `{{components.card1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.card1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.card1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Background | Theme: Surface 1 |
| Accent | Theme: Brand primary |
| Border radius | — |
| Padding | `16` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
