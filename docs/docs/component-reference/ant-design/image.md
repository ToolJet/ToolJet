---
id: image
title: Image
---

<div className="badge badge--primary">Ant Design</div>

The **Image** component shows a picture from a URL, such as a product photo or a scanned document, and can enlarge it when clicked.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Src | URL of the image. When it is empty, a placeholder shows. | Text. Default: `https://picsum.photos/seed/tj-image/800/450` |
| Alt | Alternative text for the image, read by screen readers. | Text |
| Preview | Opens the image enlarged, with zoom and rotate controls, when the user clicks it. | On or off. Default: On |
| Fallback | URL of an image to show when **Src** fails to load. | Text |
| Object fit | How the image fills its box. `cover` fills it and crops the edges, `contain` shows the whole image with space around it, and `fill` stretches it to the box. | `cover`, `contain`, `fill`. Default: `cover` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the image. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `src` | URL of the image. When it is empty, a placeholder shows. | `{{components.image1.src}}` |
| `alt` | Alternative text for the image, read by screen readers. | `{{components.image1.alt}}` |
| `preview` | Opens the image enlarged, with zoom and rotate controls, when the user clicks it. | `{{components.image1.preview}}` |
| `fallback` | URL of an image to show when **Src** fails to load. | `{{components.image1.fallback}}` |
| `objectFit` | How the image fills its box. `cover` fills it and crops the edges, `contain` shows the whole image with space around it, and `fill` stretches it to the box. | `{{components.image1.objectFit}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
