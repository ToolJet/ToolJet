---
id: title
title: Title
---

<div className="badge badge--primary">Ant Design</div>

The **Title** component is Ant Design's heading. It labels a page or a section, from a large page title down to a small subheading.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text of the heading. | Text. Default: `Quarterly overview` |
| Level | Heading size, from `1` for the largest to `5` for the smallest. | Number. Default: `3` |
| Type | Color of the text. `secondary` is a muted gray, and `success`, `warning` and `danger` use the theme's status colors. | `default`, `secondary`, `success`, `warning`, `danger`. Default: `default` |
| Copyable | Shows a copy icon after the heading that copies it to the clipboard. | On or off. Default: Off |
| Ellipsis | Keeps the heading on one line and cuts it with an ellipsis when it's too long. Hovering shows the full text. | On or off. Default: Off |
| Mark | Highlights the heading with a yellow background. | On or off. Default: Off |
| Underline | Underlines the heading. | On or off. Default: Off |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.title1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.title1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.title1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text of the heading. | `{{components.title1.children}}` |
| `level` | Heading size, from `1` for the largest to `5` for the smallest. | `{{components.title1.level}}` |
| `type` | Color of the text. `secondary` is a muted gray, and `success`, `warning` and `danger` use the theme's status colors. | `{{components.title1.type}}` |
| `copyable` | Shows a copy icon after the heading that copies it to the clipboard. | `{{components.title1.copyable}}` |
| `ellipsis` | Keeps the heading on one line and cuts it with an ellipsis when it's too long. Hovering shows the full text. | `{{components.title1.ellipsis}}` |
| `mark` | Highlights the heading with a yellow background. | `{{components.title1.mark}}` |
| `underline` | Underlines the heading. | `{{components.title1.underline}}` |
| `isVisible` | Whether the component is visible. | `{{components.title1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.title1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.title1.isDisabled}}` |

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
