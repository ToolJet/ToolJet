---
id: link
title: Link
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Link** component shows a text link that opens a web page, such as a customer's site, a document or another tool.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Link text | Text shown as the link. | Text. Default: `View details` |
| Link target (URL) | The URL the link opens. An address without `https://`, such as `tooljet.com`, opens as a web address. | Text. Default: `https://tooljet.com` |
| Open in | Whether the link opens in a **New tab** or the **Same tab**. | New tab, Same tab. Default: New tab |
| Underline | When the link text is underlined: **Always**, **On hover** or **Never**. | Always, On hover, Never. Default: On hover |
| External-link icon | Shows an external-link icon after the text. | On or off. Default: Off |
| Font size (px) | Size of the link text in pixels. | Number. Default: `14` |
| Weight | Thickness of the link text. | Normal, Medium, Semibold, Bold. Default: Medium |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** line. | Spinner, Skeleton. Default: Spinner |

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
| On click | Triggers when the user clicks the link. |
| On hover | Triggers when the pointer moves onto the link. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Clicks the link, which fires its **On click** event and opens the URL. | `components.link1.click()` |
| Set link target | Changes the link's URL to **URL** until the **Link target** property changes. | `components.link1.setLinkTarget("")` |
| Set link text | Changes the link's text to **Text** until the **Link text** property changes. | `components.link1.setLinkText("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.link1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.link1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.link1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `linkText` | Text shown as the link. | `{{components.link1.linkText}}` |
| `linkTarget` | The URL the link opens. An address without `https://`, such as `tooljet.com`, opens as a web address. | `{{components.link1.linkTarget}}` |
| `targetType` | Whether the link opens in a **New tab** or the **Same tab**. | `{{components.link1.targetType}}` |
| `underline` | When the link text is underlined: **Always**, **On hover** or **Never**. | `{{components.link1.underline}}` |
| `showIcon` | Shows an external-link icon after the text. | `{{components.link1.showIcon}}` |
| `fontSize` | Size of the link text in pixels. | `{{components.link1.fontSize}}` |
| `fontWeight` | Thickness of the link text. | `{{components.link1.fontWeight}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** line. | `{{components.link1.loadingIndicator}}` |
| `isVisible` | Whether the component is visible. | `{{components.link1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.link1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.link1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Link color | Theme: Brand primary |
| Link hover color | Theme: Brand primary |
| Alignment | `left` |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
