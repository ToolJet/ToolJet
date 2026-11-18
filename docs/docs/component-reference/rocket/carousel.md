---
id: carousel
title: Carousel
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Carousel** component shows a set of images one or several at a time, with arrows, dots, swipes and optional autoplay. Use it for featured items, product photos or announcements on a dashboard.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Slides | The slides to show. Each item is an object with `image`, `title`, `description` and `link`, or just an image URL. Clicking a slide with a `link` opens it in a new tab. | Array |
| Start at slide (0-based) | The slide the carousel starts on, counting from `0`. Changing it moves to that slide without firing **On slide changed**. | Number. Default: `0` |
| Current slide (0-based) | The slide shown now, counting from `0`. It updates as the user moves through the slides. | Number. Default: `0` |
| Aspect ratio | Shape of each slide. `fill` stretches the slides to fill the component's box. | `fill`, `16/9`, `4/3`, `3/2`, `1/1`, `21/9`, `3/4`. Default: `fill` |
| Image fit | **Cover** fills the slide and crops the image; **Contain** shows the whole image inside the slide. | Cover, Contain. Default: Cover |
| Caption | Where a slide's title and description appear: **Overlay** on top of the image, **Below** it, or **None** to hide them. | Overlay, Below, None. Default: Overlay |
| Slides per view (1 to 4) | How many slides are visible side by side, from `1` to `4`. | Number. Default: `1` |
| Show arrows | Shows previous and next arrows over the slides. | On or off. Default: On |
| Show dots | Shows a row of dots under the slides that the user can click to jump to a slide. | On or off. Default: On |
| Loop | Moves from the last slide back to the first, and from the first to the last, instead of stopping at the ends. | On or off. Default: On |
| Autoplay | Moves to the next slide on its own every **Autoplay interval (ms)**. | On or off. Default: Off |
| Autoplay interval (ms) | Time between automatic slide changes, in milliseconds. The shortest allowed is `1000`. | Number. Default: `5000` |
| Pause on hover | Pauses autoplay while the pointer is over the carousel. | On or off. Default: On |
| Loading look | What the carousel shows while it is loading: a **Spinner** or a **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

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
| On slide changed | Triggers when the carousel moves to a different slide, whether by the user, autoplay or an action. |
| On slide clicked | Triggers when the user clicks a slide. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Next slide | Moves to the next slide. | `components.carousel1.next()` |
| Previous slide | Moves to the previous slide. | `components.carousel1.previous()` |
| Go to slide | Moves to the slide at **Index (0-based)**. | `components.carousel1.goTo("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.carousel1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.carousel1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.carousel1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `slides` | The slides to show. Each item is an object with `image`, `title`, `description` and `link`, or just an image URL. Clicking a slide with a `link` opens it in a new tab. | `{{components.carousel1.slides}}` |
| `defaultIndex` | The slide the carousel starts on, counting from `0`. Changing it moves to that slide without firing **On slide changed**. | `{{components.carousel1.defaultIndex}}` |
| `currentIndex` | The slide shown now, counting from `0`. It updates as the user moves through the slides. | `{{components.carousel1.currentIndex}}` |
| `aspectRatio` | Shape of each slide. `fill` stretches the slides to fill the component's box. | `{{components.carousel1.aspectRatio}}` |
| `imageFit` | **Cover** fills the slide and crops the image; **Contain** shows the whole image inside the slide. | `{{components.carousel1.imageFit}}` |
| `captionPosition` | Where a slide's title and description appear: **Overlay** on top of the image, **Below** it, or **None** to hide them. | `{{components.carousel1.captionPosition}}` |
| `slidesPerView` | How many slides are visible side by side, from `1` to `4`. | `{{components.carousel1.slidesPerView}}` |
| `showArrows` | Shows previous and next arrows over the slides. | `{{components.carousel1.showArrows}}` |
| `showDots` | Shows a row of dots under the slides that the user can click to jump to a slide. | `{{components.carousel1.showDots}}` |
| `loop` | Moves from the last slide back to the first, and from the first to the last, instead of stopping at the ends. | `{{components.carousel1.loop}}` |
| `autoplay` | Moves to the next slide on its own every **Autoplay interval (ms)**. | `{{components.carousel1.autoplay}}` |
| `interval` | Time between automatic slide changes, in milliseconds. The shortest allowed is `1000`. | `{{components.carousel1.interval}}` |
| `pauseOnHover` | Pauses autoplay while the pointer is over the carousel. | `{{components.carousel1.pauseOnHover}}` |
| `loadingIndicator` | What the carousel shows while it is loading: a **Spinner** or a **Skeleton** placeholder. | `{{components.carousel1.loadingIndicator}}` |
| `currentSlide` | The slide shown now, as its `image`, `title`, `description` and `link`. | `{{components.carousel1.currentSlide}}` |
| `clickedSlide` | The slide the user last clicked, with its `index`. | `{{components.carousel1.clickedSlide}}` |
| `isVisible` | Whether the component is visible. | `{{components.carousel1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.carousel1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.carousel1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Slide background | Theme: Surface 3 |
| Arrow background | Theme: Surface 1 |
| Arrow icon color | Theme: Primary text |
| Dot color | Theme: Primary text |
| Active dot color | Theme: Brand primary |
| Caption overlay background | — |
| Caption overlay text color | `#fff` |
| Caption title color (below) | Theme: Primary text |
| Caption description color (below) | Theme: Placeholder text |
| Slide radius | — |
| Gap between slides (px) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
