---
id: tabs
title: Tabs
---

<div className="badge badge--primary">Ant Design</div>

The **Tabs** component is Ant Design's tab set. Each tab holds its own components, so related views such as details, history and settings share one area of the page.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Items | The tabs, each with a `key` and a `label`. Each tab holds its own components. | Array |
| Active key | Key of the tab that is open. Leave it empty to open the first tab. | Text |
| Type | Look of the tabs. `line` underlines the open tab; `card` draws each tab as a raised card. | `line`, `card`. Default: `line` |
| Size | Size of the tab labels. | `small`, `middle`, `large`. Default: `middle` |
| Centered | Centers the tab labels in the tab bar. | On or off. Default: Off |
| Tab position | Side of the component where the tab labels sit. | `top`, `left`, `right`, `bottom`. Default: `top` |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On change | Triggers when the open tab changes. |
| On tab click | Triggers when the user clicks a tab label, including the tab already open. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set active tab | Opens the tab with the given **Tab key**. A key that matches no tab opens the first tab. | `components.tabs1.setActiveKey("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.tabs1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.tabs1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.tabs1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.tabs1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.tabs1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.tabs1.isDisabled}}` |

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
