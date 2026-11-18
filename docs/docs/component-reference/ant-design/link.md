---
id: link
title: Link
---

<div className="badge badge--primary">Ant Design</div>

The **Link** component shows clickable text that opens a URL or runs an action, such as a link to a help page or a record.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text shown as the link. | Text. Default: `Link` |
| Href | The URL to open. Only web, email and phone links open. Leave it empty to use the link only for its **On click** event. | Text |
| Target | Where the link opens: `_blank` for a new tab, `_self` for the same tab. | `_blank`, `_self`. Default: `_blank` |
| Underline | When the text is underlined: on `hover`, `always` or never (`none`). | `hover`, `always`, `none`. Default: `hover` |
| Strong | Shows the text in bold. | On or off. Default: Off |
| Show icon | Shows an external link icon after the text. | On or off. Default: Off |

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
| Click | Clicks the link, which opens **Href** and fires its **On click** event. | `components.link1.click()` |
| Set href | Changes the URL the link opens. | `components.link1.setHref("")` |
| Set text | Changes the link's text. | `components.link1.setChildren("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.link1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.link1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.link1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text shown as the link. | `{{components.link1.children}}` |
| `href` | The URL to open. Only web, email and phone links open. Leave it empty to use the link only for its **On click** event. | `{{components.link1.href}}` |
| `target` | Where the link opens: `_blank` for a new tab, `_self` for the same tab. | `{{components.link1.target}}` |
| `underline` | When the text is underlined: on `hover`, `always` or never (`none`). | `{{components.link1.underline}}` |
| `strong` | Shows the text in bold. | `{{components.link1.strong}}` |
| `showIcon` | Shows an external link icon after the text. | `{{components.link1.showIcon}}` |
| `isVisible` | Whether the component is visible. | `{{components.link1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.link1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.link1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
