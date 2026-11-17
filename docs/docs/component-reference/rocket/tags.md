---
id: tags
title: Tags
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Tags** component shows a read-only list of labels as colored chips, such as the categories, skills or statuses attached to a record. The user can click a tag to act on it.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tags (array or comma-separated) | Tags to show, as a list or comma-separated text. Each can be plain text or an item with a `label` and a `color`. | Array. Default: `["Design", "Frontend", "Urgent"]` |
| Colours by tag | A color for each tag, for example `{ "Urgent": "#dc2626" }`. A tag's own `color` wins. | Object. Default: `{"Urgent": "#dc2626"}` |
| Variant | Fill style of the chips: a light **Soft** tint, an **Outline**, or a **Solid** fill. | Soft, Outline, Solid. Default: Soft |
| Size | Size of the chips. | Sm, Default, Lg. Default: Default |
| Overflow | What happens when the tags don't fit: **Wrap** onto more lines, show **One line, +N** with a count of the rest, or **Scroll** sideways on one line. | Wrap, One line, +N, Scroll. Default: Wrap |
| Pill shape | Gives the chips fully rounded ends. | On or off. Default: Off |
| Loading look | What shows while the component is loading: a spinner or skeleton chips. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On tag clicked](../common-settings.md#events) | Triggers when the user clicks a tag. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `tags` | Tags to show, as a list or comma-separated text. Each can be plain text or an item with a `label` and a `color`. | `{{components.tags1.tags}}` |
| `tagColors` | A color for each tag, for example `{ "Urgent": "#dc2626" }`. A tag's own `color` wins. | `{{components.tags1.tagColors}}` |
| `variant` | Fill style of the chips: a light **Soft** tint, an **Outline**, or a **Solid** fill. | `{{components.tags1.variant}}` |
| `size` | Size of the chips. | `{{components.tags1.size}}` |
| `overflow` | What happens when the tags don't fit: **Wrap** onto more lines, show **One line, +N** with a count of the rest, or **Scroll** sideways on one line. | `{{components.tags1.overflow}}` |
| `pill` | Gives the chips fully rounded ends. | `{{components.tags1.pill}}` |
| `loadingIndicator` | What shows while the component is loading: a spinner or skeleton chips. | `{{components.tags1.loadingIndicator}}` |
| `lastClickedTag` | The label of the tag the user clicked last. | `{{components.tags1.lastClickedTag}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Tag background (unmapped tags) | Theme: Surface 3 |
| Tag text color (unmapped tags) | Theme: Primary text |
| Tag border color | `transparent` |
| Tag radius | — |
