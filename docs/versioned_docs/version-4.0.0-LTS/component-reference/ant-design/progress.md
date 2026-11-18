---
id: progress
title: Progress
---

<div className="badge badge--primary">Ant Design</div>

The **Progress** component is Ant Design's progress indicator. It shows how far a task or goal has come, as a bar or a ring.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Percent | How complete the task is, from 0 to 100. | Number. Default: `60` |
| Type | Shape of the indicator. `line` is a bar, `circle` a full ring and `dashboard` a ring with a gap at the bottom. | `line`, `circle`, `dashboard`. Default: `line` |
| Status | State shown on the indicator. `active` animates the bar, `success` turns it green with a check, and `exception` turns it red with a cross. | `normal`, `active`, `success`, `exception`. Default: `normal` |
| Show info | Shows the percent, or the success or exception icon, next to the bar or inside the ring. | On or off. Default: On |
| Steps | Splits a `line` bar into this many segments. `0` draws a continuous bar. | Number. Default: `0` |
| Stroke color | Color of the filled part. Leave it empty to use the theme's primary color. | Text |
| Title | Caption shown above a `line` bar. | Text |

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

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.progress1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.progress1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.progress1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `percent` | How complete the task is, from 0 to 100. | `{{components.progress1.percent}}` |
| `type` | Shape of the indicator. `line` is a bar, `circle` a full ring and `dashboard` a ring with a gap at the bottom. | `{{components.progress1.type}}` |
| `status` | State shown on the indicator. `active` animates the bar, `success` turns it green with a check, and `exception` turns it red with a cross. | `{{components.progress1.status}}` |
| `showInfo` | Shows the percent, or the success or exception icon, next to the bar or inside the ring. | `{{components.progress1.showInfo}}` |
| `steps` | Splits a `line` bar into this many segments. `0` draws a continuous bar. | `{{components.progress1.steps}}` |
| `strokeColor` | Color of the filled part. Leave it empty to use the theme's primary color. | `{{components.progress1.strokeColor}}` |
| `title` | Caption shown above a `line` bar. | `{{components.progress1.title}}` |
| `isVisible` | Whether the component is visible. | `{{components.progress1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.progress1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.progress1.isDisabled}}` |

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
