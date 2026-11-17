---
id: text
title: Text
---

<div className="badge badge--primary">Ant Design</div>

The **Text** component is Ant Design's paragraph text. It shows body text such as descriptions, notes and help text, with optional styling and a copy button.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Text | Text to show. Line breaks in it are kept. | Text. Default: `Add a short description here.` |
| Type | Color of the text. `secondary` is a muted gray, and `success`, `warning` and `danger` use the theme's status colors. | `default`, `secondary`, `success`, `warning`, `danger`. Default: `default` |
| Strong | Shows the text in bold. | On or off. Default: Off |
| Italic | Shows the text in italics. | On or off. Default: Off |
| Code | Shows the text in a monospace code style with a light background. | On or off. Default: Off |
| Copyable | Shows a copy icon after the text that copies it to the clipboard. | On or off. Default: Off |
| Ellipsis rows | Number of lines shown before the text is cut with an ellipsis. Hovering shows the full text. `0` shows all of it. | Number. Default: `0` |
| Align | Horizontal alignment of the text. | `left`, `center`, `right`. Default: `left` |

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
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.text1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.text1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.text1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `children` | Text to show. Line breaks in it are kept. | `{{components.text1.children}}` |
| `type` | Color of the text. `secondary` is a muted gray, and `success`, `warning` and `danger` use the theme's status colors. | `{{components.text1.type}}` |
| `strong` | Shows the text in bold. | `{{components.text1.strong}}` |
| `italic` | Shows the text in italics. | `{{components.text1.italic}}` |
| `code` | Shows the text in a monospace code style with a light background. | `{{components.text1.code}}` |
| `copyable` | Shows a copy icon after the text that copies it to the clipboard. | `{{components.text1.copyable}}` |
| `ellipsis` | Number of lines shown before the text is cut with an ellipsis. Hovering shows the full text. `0` shows all of it. | `{{components.text1.ellipsis}}` |
| `align` | Horizontal alignment of the text. | `{{components.text1.align}}` |
| `isVisible` | Whether the component is visible. | `{{components.text1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.text1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.text1.isDisabled}}` |

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
