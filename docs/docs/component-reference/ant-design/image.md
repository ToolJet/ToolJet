---
id: image
title: Image
---

<div className="badge badge--primary">Ant Design</div>

The **Image** component shows a picture from a URL, such as a product photo or a scanned document, and can enlarge it when clicked.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Src | URL of the image. When it is empty, a placeholder shows. | Text. Default: `https://picsum.photos/seed/tj-image/800/450` |
| Alt | Alternative text for the image, read by screen readers. | Text |
| Preview | Opens the image enlarged, with zoom and rotate controls, when the user clicks it. | On or off. Default: On |
| Fallback | URL of an image to show when **Src** fails to load. | Text |
| Object fit | How the image fills its box. `cover` fills it and crops the edges, `contain` shows the whole image with space around it, and `fill` stretches it to the box. | `cover`, `contain`, `fill`. Default: `cover` |

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
| On click | Triggers when the user clicks the image. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.image1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.image1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.image1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `src` | URL of the image. When it is empty, a placeholder shows. | `{{components.image1.src}}` |
| `alt` | Alternative text for the image, read by screen readers. | `{{components.image1.alt}}` |
| `preview` | Opens the image enlarged, with zoom and rotate controls, when the user clicks it. | `{{components.image1.preview}}` |
| `fallback` | URL of an image to show when **Src** fails to load. | `{{components.image1.fallback}}` |
| `objectFit` | How the image fills its box. `cover` fills it and crops the edges, `contain` shows the whole image with space around it, and `fill` stretches it to the box. | `{{components.image1.objectFit}}` |
| `isVisible` | Whether the component is visible. | `{{components.image1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.image1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.image1.isDisabled}}` |

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
