---
id: text
title: Text
---

<div className="badge badge--primary">Ant Design</div>

The **Text** component is Ant Design's paragraph text. It shows body text such as descriptions, notes and help text, with optional styling and a copy button.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
