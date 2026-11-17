---
id: hero
title: Hero
---

<div className="badge badge--primary">Ant Design</div>

The **Hero** component is a large header at the top of a page, with a title, a short summary, up to two buttons and an optional key figure, such as a welcome banner on a dashboard.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Eyebrow | Small text shown above the title, such as a section name. | Text |
| Title | Main heading. | Text. Default: `Good morning` |
| Sub title | Text shown under the title. | Text. Default: `Here is what changed since yesterday.` |
| Meta | Small text shown under the sub title, such as a date or owner. A list of `{label, value}` shows as `Label: value` items. | Text |
| Action label | Text of the main button. Leave it empty for no button. | Text |
| Secondary action label | Text of a second, outlined button. Leave it empty for no button. | Text |
| Aside value | A key figure shown large at the right, such as `128` or `$42K`. Leave it empty to hide it. | Text |
| Aside label | Caption shown above **Aside value**. | Text |
| Icon | An icon shown above the text, by its Ant Design name, such as `RocketOutlined`, or a plain word, such as `rocket`. | Text |
| Background | Look of the header. `plain` has no fill, `tint` is a light wash of the theme color, `gradient` fades that wash into the page background, `dark` is dark navy and `solid` is the theme color, both with light text, and `image` shows **Image URL** behind a dark overlay. | `plain`, `tint`, `gradient`, `image`, `dark`, `solid`. Default: `tint` |
| Image URL | URL of the background image, used when **Background** is `image`. | Text |
| Align | Whether the text and buttons line up at the left or in the center. | `left`, `center`. Default: `left` |
| Size | Size of the title and the space around it. | `compact`, `default`, `large`. Default: `default` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On action clicked](../common-settings.md#events) | Triggers when the user clicks the main button. |
| [On secondary action clicked](../common-settings.md#events) | Triggers when the user clicks the second button. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `eyebrow` | Small text shown above the title, such as a section name. | `{{components.hero1.eyebrow}}` |
| `title` | Main heading. | `{{components.hero1.title}}` |
| `subTitle` | Text shown under the title. | `{{components.hero1.subTitle}}` |
| `meta` | Small text shown under the sub title, such as a date or owner. A list of `{label, value}` shows as `Label: value` items. | `{{components.hero1.meta}}` |
| `actionLabel` | Text of the main button. Leave it empty for no button. | `{{components.hero1.actionLabel}}` |
| `secondaryActionLabel` | Text of a second, outlined button. Leave it empty for no button. | `{{components.hero1.secondaryActionLabel}}` |
| `asideValue` | A key figure shown large at the right, such as `128` or `$42K`. Leave it empty to hide it. | `{{components.hero1.asideValue}}` |
| `asideLabel` | Caption shown above **Aside value**. | `{{components.hero1.asideLabel}}` |
| `icon` | An icon shown above the text, by its Ant Design name, such as `RocketOutlined`, or a plain word, such as `rocket`. | `{{components.hero1.icon}}` |
| `background` | Look of the header. `plain` has no fill, `tint` is a light wash of the theme color, `gradient` fades that wash into the page background, `dark` is dark navy and `solid` is the theme color, both with light text, and `image` shows **Image URL** behind a dark overlay. | `{{components.hero1.background}}` |
| `imageUrl` | URL of the background image, used when **Background** is `image`. | `{{components.hero1.imageUrl}}` |
| `align` | Whether the text and buttons line up at the left or in the center. | `{{components.hero1.align}}` |
| `size` | Size of the title and the space around it. | `{{components.hero1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
