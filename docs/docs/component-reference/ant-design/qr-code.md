---
id: qr-code
title: QR Code
---

<div className="badge badge--primary">Ant Design</div>

The **QR Code** component is Ant Design's QR code. It turns a URL or any text into a code that people scan with a phone, for example to open an order page or check in to an event.

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
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.qrcode1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.qrcode1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.qrcode1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.qrcode1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.qrcode1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.qrcode1.isDisabled}}` |

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
