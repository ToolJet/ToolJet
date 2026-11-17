---
id: link
title: Link
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Link** component shows a text link that opens a web page, such as a customer's site, a document or another tool.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the link. |
| [On hover](../common-settings.md#events) | Triggers when the pointer moves onto the link. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Clicks the link, which fires its **On click** event and opens the URL. | `components.link1.click()` |
| Set link target | Changes the link's URL to **URL** until the **Link target** property changes. | `components.link1.setLinkTarget("")` |
| Set link text | Changes the link's text to **Text** until the **Link text** property changes. | `components.link1.setLinkText("")` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Link color | Theme: Brand primary |
| Link hover color | Theme: Brand primary |
| Alignment | `left` |
