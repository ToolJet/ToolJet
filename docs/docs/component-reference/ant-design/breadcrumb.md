---
id: breadcrumb
title: Breadcrumb
---

<div className="badge badge--primary">Ant Design</div>

The **Breadcrumb** component shows where the current page sits in the app, such as Home / Orders / Order 1042, and lets users go back to an earlier level.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The levels to show, from top to current, as text such as `['Home', 'Orders']` or a list of `{title, key}`. Every item but the last is a link. | Array. Default: `["Home", "Orders", "Order 1042"]` |
| Separator | Character shown between items. | Text. Default: `/` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks an item. The last item is the current page and is not clickable. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The levels to show, from top to current, as text such as `['Home', 'Orders']` or a list of `{title, key}`. Every item but the last is a link. | `{{components.breadcrumb1.items}}` |
| `separator` | Character shown between items. | `{{components.breadcrumb1.separator}}` |
| `clickedKey` | Key of the item the user clicked last, or its title when it has no key. | `{{components.breadcrumb1.clickedKey}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
