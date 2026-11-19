---
id: circular-progress
title: Circular Progress
---

<div className="badge badge--primary">Ant Design</div>

The **Circular Progress** component shows a percentage as a ring, such as how much of a task or a quota is done.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Percent | How full the ring is, from 0 to 100. | Number. Default: `75` |
| Size (px) | Width and height of the ring, from 32 to 400 pixels. It shrinks to fit a smaller box. | Number. Default: `120` |
| Stroke width | Thickness of the ring, as a percent of its size. | Number. Default: `6` |
| Line cap | Shape of the ends of the filled part: `round` or square (`butt`). | `round`, `butt`. Default: `round` |
| Type | `circle` is a full ring; `dashboard` is a ring with a gap at the bottom, like a gauge. | `circle`, `dashboard`. Default: `circle` |
| Center | What shows in the middle: the `percent`, custom **Text** (`custom`) or nothing (`none`). | `percent`, `custom`, `none`. Default: `percent` |
| Text | Text shown in the middle when **Center** is `custom`. | Text |
| Label | Caption shown under the ring. | Text |
| Status | Color of the ring. `success` is green and `exception` is red; with **Center** set to `percent` they show a check or a cross in place of the number. | `normal`, `success`, `exception`, `active`. Default: `normal` |

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

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set percent | Changes how full the ring is, from 0 to 100. | `components.circularprogress1.setPercent("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.circularprogress1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.circularprogress1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.circularprogress1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `percent` | How full the ring is, from 0 to 100. | `{{components.circularprogress1.percent}}` |
| `size` | Width and height of the ring, from 32 to 400 pixels. It shrinks to fit a smaller box. | `{{components.circularprogress1.size}}` |
| `strokeWidth` | Thickness of the ring, as a percent of its size. | `{{components.circularprogress1.strokeWidth}}` |
| `strokeLinecap` | Shape of the ends of the filled part: `round` or square (`butt`). | `{{components.circularprogress1.strokeLinecap}}` |
| `type` | `circle` is a full ring; `dashboard` is a ring with a gap at the bottom, like a gauge. | `{{components.circularprogress1.type}}` |
| `format` | What shows in the middle: the `percent`, custom **Text** (`custom`) or nothing (`none`). | `{{components.circularprogress1.format}}` |
| `text` | Text shown in the middle when **Center** is `custom`. | `{{components.circularprogress1.text}}` |
| `label` | Caption shown under the ring. | `{{components.circularprogress1.label}}` |
| `status` | Color of the ring. `success` is green and `exception` is red; with **Center** set to `percent` they show a check or a cross in place of the number. | `{{components.circularprogress1.status}}` |
| `isVisible` | Whether the component is visible. | `{{components.circularprogress1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.circularprogress1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.circularprogress1.isDisabled}}` |

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
