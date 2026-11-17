---
id: image
title: Image
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Image** component shows a picture from a URL, such as a product photo, a logo or an uploaded file. It shows a fallback when the image is missing or fails to load.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Image URL | URL of the image to show. | Text. Default: `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800` |
| Alt text | Description of the image read by screen readers. It is also the fallback text when **Fallback name (initials) or text** is empty. | Text. Default: `Mountain lake at sunrise` |
| Fit | How the image fills its box: **Cover** fills and crops, **Contain** shows the whole image, **Fill** stretches it. | Cover (fill, crop), Contain (whole image), Fill (stretch). Default: Cover (fill, crop) |
| Aspect ratio | Shape of the image box. **Auto** fills the component's height. | Auto (widget height), 1:1 square, 4:3, 3:2, 16:9, 21:9, 3:4 portrait, 9:16 portrait. Default: Auto (widget height) |
| Caption | Text shown under the image. | Text |
| Fallback | What shows when there is no image or it fails to load: a **Placeholder** with text, an **Icon**, or **Initials** made from the fallback name. | Placeholder, Icon, Initials. Default: Placeholder |
| Fallback name (initials) or text | Name to make initials from, or text for the placeholder, when the image can't be shown. | Text |
| Border | Draws a border around the image. | On or off. Default: Off |
| Zoom on click (lightbox) | Opens the image full size in a lightbox when the user clicks it. | On or off. Default: Off |
| Loading look | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the image. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set image URL | Shows the image at **URL** in place of the current one. | `components.image1.setImageURL("")` |
| Clear image | Removes the image, so the fallback shows. | `components.image1.clearImage()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `source` | URL of the image to show. | `{{components.image1.source}}` |
| `alternativeText` | Description of the image read by screen readers. It is also the fallback text when **Fallback name (initials) or text** is empty. | `{{components.image1.alternativeText}}` |
| `imageFit` | How the image fills its box: **Cover** fills and crops, **Contain** shows the whole image, **Fill** stretches it. | `{{components.image1.imageFit}}` |
| `aspectRatio` | Shape of the image box. **Auto** fills the component's height. | `{{components.image1.aspectRatio}}` |
| `caption` | Text shown under the image. | `{{components.image1.caption}}` |
| `fallback` | What shows when there is no image or it fails to load: a **Placeholder** with text, an **Icon**, or **Initials** made from the fallback name. | `{{components.image1.fallback}}` |
| `fallbackText` | Name to make initials from, or text for the placeholder, when the image can't be shown. | `{{components.image1.fallbackText}}` |
| `showBorder` | Draws a border around the image. | `{{components.image1.showBorder}}` |
| `zoomOnClick` | Opens the image full size in a lightbox when the user clicks it. | `{{components.image1.zoomOnClick}}` |
| `loadingIndicator` | What the component shows while it is loading: a **Spinner** or a grey **Skeleton** placeholder. | `{{components.image1.loadingIndicator}}` |
| `hasError` | `true` when there is no image URL or the image failed to load. | `{{components.image1.hasError}}` |
| `imageURL` | URL of the image the component is showing. | `{{components.image1.imageURL}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Image radius | — |
| Border color | Theme: Default border |
| Background (letterbox and fallback) | — |
| Fallback text and icon color | Theme: Placeholder text |
| Caption color | Theme: Placeholder text |
