---
id: title
title: Title
---

<div className="badge badge--primary">Ant Design</div>

The **Title** component is Ant Design's heading. It labels a page or a section, from a large page title down to a small subheading.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
