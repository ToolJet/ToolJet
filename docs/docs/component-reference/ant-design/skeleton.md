---
id: skeleton
title: Skeleton
---

<div className="badge badge--primary">Ant Design</div>

The **Skeleton** component is Ant Design's loading placeholder. It shows gray bars in the shape of content while that content loads, so the page doesn't jump when it arrives.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Active | Animates the bars with a shimmer. | On or off. Default: On |
| Avatar | Shows a round avatar placeholder at the left. | On or off. Default: Off |
| Title | Shows a wider bar at the top for a heading. | On or off. Default: On |
| Paragraph rows | Number of paragraph bars under the title. Only the rows that fit in the component's box are drawn. | Number. Default: `3` |
| Loading | Shows the placeholder. Turn it off, for example with `{{queries.getOrders.isLoading}}`, to hide it once the content has loaded. | On or off. Default: On |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `active` | Animates the bars with a shimmer. | `{{components.skeleton1.active}}` |
| `avatar` | Shows a round avatar placeholder at the left. | `{{components.skeleton1.avatar}}` |
| `title` | Shows a wider bar at the top for a heading. | `{{components.skeleton1.title}}` |
| `rows` | Number of paragraph bars under the title. Only the rows that fit in the component's box are drawn. | `{{components.skeleton1.rows}}` |
| `loading` | Shows the placeholder. Turn it off, for example with `{{queries.getOrders.isLoading}}`, to hide it once the content has loaded. | `{{components.skeleton1.loading}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
