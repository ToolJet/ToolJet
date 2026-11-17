---
id: link
title: Link
---

<div className="badge badge--primary">Ant Design</div>

The **Link** component shows clickable text that opens a URL or runs an action, such as a link to a help page or a record.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown as the link. | Text. Default: `Link` |
| Href | The URL to open. Only web, email and phone links open. Leave it empty to use the link only for its **On click** event. | Text |
| Target | Where the link opens: `_blank` for a new tab, `_self` for the same tab. | `_blank`, `_self`. Default: `_blank` |
| Underline | When the text is underlined: on `hover`, `always` or never (`none`). | `hover`, `always`, `none`. Default: `hover` |
| Strong | Shows the text in bold. | On or off. Default: Off |
| Show icon | Shows an external link icon after the text. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks the link. |
| [On hover](../common-settings.md#events) | Triggers when the pointer moves onto the link. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Click | Clicks the link, which opens **Href** and fires its **On click** event. | `components.link1.click()` |
| Set href | Changes the URL the link opens. | `components.link1.setHref("")` |
| Set text | Changes the link's text. | `components.link1.setChildren("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown as the link. | `{{components.link1.children}}` |
| `href` | The URL to open. Only web, email and phone links open. Leave it empty to use the link only for its **On click** event. | `{{components.link1.href}}` |
| `target` | Where the link opens: `_blank` for a new tab, `_self` for the same tab. | `{{components.link1.target}}` |
| `underline` | When the text is underlined: on `hover`, `always` or never (`none`). | `{{components.link1.underline}}` |
| `strong` | Shows the text in bold. | `{{components.link1.strong}}` |
| `showIcon` | Shows an external link icon after the text. | `{{components.link1.showIcon}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
