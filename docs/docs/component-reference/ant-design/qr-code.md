---
id: qr-code
title: QR Code
---

<div className="badge badge--primary">Ant Design</div>

The **QR Code** component is Ant Design's QR code. It turns a URL or any text into a code that people scan with a phone, for example to open an order page or check in to an event.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Value | Text or URL the code holds. Text too long for a QR code shows a notice instead. | Text. Default: `https://tooljet.com` |
| Size (px) | Width and height of the code. | Number. Default: `160` |
| Color | Color of the code's dots. Leave it empty to follow the theme's text color. | Text |
| Background | Background color behind the code. Leave it empty to follow the theme. | Text |
| Error level | How much of the code can be damaged or covered and still scan: `L` about 7%, `M` 15%, `Q` 25% and `H` 30%. Higher levels make denser codes. | `L`, `M`, `Q`, `H`. Default: `M` |
| Icon | URL of an image, such as a logo, drawn in the middle of the code. Use **Error level** `H` so the code still scans. | Text |
| Bordered | Draws a border around the code. | On or off. Default: On |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `value` | Text or URL the code holds. Text too long for a QR code shows a notice instead. | `{{components.qrcode1.value}}` |
| `size` | Width and height of the code. | `{{components.qrcode1.size}}` |
| `color` | Color of the code's dots. Leave it empty to follow the theme's text color. | `{{components.qrcode1.color}}` |
| `bgColor` | Background color behind the code. Leave it empty to follow the theme. | `{{components.qrcode1.bgColor}}` |
| `errorLevel` | How much of the code can be damaged or covered and still scan: `L` about 7%, `M` 15%, `Q` 25% and `H` 30%. Higher levels make denser codes. | `{{components.qrcode1.errorLevel}}` |
| `icon` | URL of an image, such as a logo, drawn in the middle of the code. Use **Error level** `H` so the code still scans. | `{{components.qrcode1.icon}}` |
| `bordered` | Draws a border around the code. | `{{components.qrcode1.bordered}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
