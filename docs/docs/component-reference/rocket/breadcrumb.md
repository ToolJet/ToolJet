---
id: breadcrumb
title: Breadcrumb
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Breadcrumb** component shows the path to the current page, such as Home > Orders > Order 1042, so users can see where they are and go back up a level.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The steps of the path, as text or `{ title, value }` objects. The last item is the current page and can't be clicked. Long paths show the first item and the last few with `…` between. | Array. Default: `["Home", "Section", "Page"]` |
| Loading look | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | Spinner, Skeleton. Default: Spinner |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On item clicked](../common-settings.md#events) | Triggers when the user clicks an item in the path. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The steps of the path, as text or `{ title, value }` objects. The last item is the current page and can't be clicked. Long paths show the first item and the last few with `…` between. | `{{components.breadcrumb1.items}}` |
| `loadingIndicator` | What shows while the component is loading: a **Spinner** or a **Skeleton** placeholder in the component's shape. | `{{components.breadcrumb1.loadingIndicator}}` |
| `lastClickedItem` | The item the user last clicked, with its `title`, `value` and `index` in **Items**. | `{{components.breadcrumb1.lastClickedItem}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Breadcrumb link color | Theme: Placeholder text |
| Current page color | Theme: Primary text |
| Separator color | Theme: Placeholder text |
