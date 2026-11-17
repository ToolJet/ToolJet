---
id: menu
title: Menu
---

<div className="badge badge--primary">Ant Design</div>

The **Menu** component shows a list of navigation links, as a sidebar or a top bar, with optional submenus. Use it to move between sections of an app.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The menu entries, as a list of `{key, label}`. Add `children` with more entries to make a submenu. | Array |
| Mode | `inline` is a sidebar with submenus that expand in place; `vertical` is a sidebar with submenus that open to the side; `horizontal` is a top bar, with entries that don't fit moved into a `...` menu. | `horizontal`, `vertical`, `inline`. Default: `inline` |
| Theme | Light or dark background. | `light`, `dark`. Default: `light` |
| Selected key | Key of the entry shown as selected. It updates when the user clicks an entry. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On click](../common-settings.md#events) | Triggers when the user clicks a menu entry. |
| [On select](../common-settings.md#events) | Triggers when the user selects a menu entry. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select item | Marks the entry with the given **Key** as selected, without firing any events. | `components.menu1.setSelectedKey("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The menu entries, as a list of `{key, label}`. Add `children` with more entries to make a submenu. | `{{components.menu1.items}}` |
| `mode` | `inline` is a sidebar with submenus that expand in place; `vertical` is a sidebar with submenus that open to the side; `horizontal` is a top bar, with entries that don't fit moved into a `...` menu. | `{{components.menu1.mode}}` |
| `theme` | Light or dark background. | `{{components.menu1.theme}}` |
| `selectedKey` | Key of the entry shown as selected. It updates when the user clicks an entry. | `{{components.menu1.selectedKey}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
