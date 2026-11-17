---
id: tabs
title: Tabs
---

<div className="badge badge--primary">Ant Design</div>

The **Tabs** component is Ant Design's tab set. Each tab holds its own components, so related views such as details, history and settings share one area of the page.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The tabs, each with a `key` and a `label`. Each tab holds its own components. | Array |
| Active key | Key of the tab that is open. Leave it empty to open the first tab. | Text |
| Type | Look of the tabs. `line` underlines the open tab; `card` draws each tab as a raised card. | `line`, `card`. Default: `line` |
| Size | Size of the tab labels. | `small`, `middle`, `large`. Default: `middle` |
| Centered | Centers the tab labels in the tab bar. | On or off. Default: Off |
| Tab position | Side of the component where the tab labels sit. | `top`, `left`, `right`, `bottom`. Default: `top` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the open tab changes. |
| [On tab click](../common-settings.md#events) | Triggers when the user clicks a tab label, including the tab already open. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set active tab | Opens the tab with the given **Tab key**. A key that matches no tab opens the first tab. | `components.tabs1.setActiveKey("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `items` | The tabs, each with a `key` and a `label`. Each tab holds its own components. | `{{components.tabs1.items}}` |
| `activeKey` | Key of the tab that is open. Leave it empty to open the first tab. | `{{components.tabs1.activeKey}}` |
| `type` | Look of the tabs. `line` underlines the open tab; `card` draws each tab as a raised card. | `{{components.tabs1.type}}` |
| `size` | Size of the tab labels. | `{{components.tabs1.size}}` |
| `centered` | Centers the tab labels in the tab bar. | `{{components.tabs1.centered}}` |
| `tabPosition` | Side of the component where the tab labels sit. | `{{components.tabs1.tabPosition}}` |
| `clickedTab` | Key of the tab the user clicked last. | `{{components.tabs1.clickedTab}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
