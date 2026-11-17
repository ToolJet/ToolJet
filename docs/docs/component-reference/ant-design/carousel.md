---
id: carousel
title: Carousel
---

<div className="badge badge--primary">Ant Design</div>

The **Carousel** component shows images one at a time as slides, with an optional title and caption on each, such as announcements or product photos.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The slides, as a list of `{src, title, description}`, where `src` is the image URL. A plain list of image URLs also works. | Array |
| Autoplay | Moves to the next slide on its own. | On or off. Default: Off |
| Autoplay speed (ms) | Time each slide stays on screen when **Autoplay** is on, in milliseconds. The lowest is 500. | Number. Default: `3000` |
| Dots | Shows dots under the slides that show the current slide and jump to another. | On or off. Default: On |
| Arrows | Shows previous and next arrows at the sides. | On or off. Default: On |
| Effect | How slides change. `scrollx` slides sideways; `fade` fades one into the next. | `scrollx`, `fade`. Default: `scrollx` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [After change](../common-settings.md#events) | Triggers when the carousel has moved to another slide. |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
