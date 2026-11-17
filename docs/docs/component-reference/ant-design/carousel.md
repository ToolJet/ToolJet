---
id: carousel
title: Carousel
---

<div className="badge badge--primary">Ant Design</div>

The **Carousel** component shows images one at a time as slides, with an optional title and caption on each, such as announcements or product photos.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The slides, as a list of `{src, title, description}`, where `src` is the image URL. A plain list of image URLs also works. | Array |
| Autoplay | Moves to the next slide on its own. | On or off. Default: Off |
| Autoplay speed (ms) | Time each slide stays on screen when **Autoplay** is on, in milliseconds. The lowest is 500. | Number. Default: `3000` |
| Dots | Shows dots under the slides that show the current slide and jump to another. | On or off. Default: On |
| Arrows | Shows previous and next arrows at the sides. | On or off. Default: On |
| Effect | How slides change. `scrollx` slides sideways; `fade` fades one into the next. | `scrollx`, `fade`. Default: `scrollx` |

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
| After change | Triggers when the carousel has moved to another slide. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.carousel1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.carousel1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.carousel1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The slides, as a list of `{src, title, description}`, where `src` is the image URL. A plain list of image URLs also works. | `{{components.carousel1.items}}` |
| `autoplay` | Moves to the next slide on its own. | `{{components.carousel1.autoplay}}` |
| `autoplaySpeed` | Time each slide stays on screen when **Autoplay** is on, in milliseconds. The lowest is 500. | `{{components.carousel1.autoplaySpeed}}` |
| `dots` | Shows dots under the slides that show the current slide and jump to another. | `{{components.carousel1.dots}}` |
| `arrows` | Shows previous and next arrows at the sides. | `{{components.carousel1.arrows}}` |
| `effect` | How slides change. `scrollx` slides sideways; `fade` fades one into the next. | `{{components.carousel1.effect}}` |
| `current` | Position of the slide shown now, starting at 0. | `{{components.carousel1.current}}` |
| `isVisible` | Whether the component is visible. | `{{components.carousel1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.carousel1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.carousel1.isDisabled}}` |

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
