---
id: tree
title: Tree
---

<div className="badge badge--primary">Ant Design</div>

The **Tree** component is Ant Design's tree view. It shows nested items, such as folders, categories or an org chart, that users expand, select and optionally check.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tree data | The nodes, each with a `title`, a unique `key` and optional `children`, such as `[{ title: 'Projects', key: 'projects', children: [...] }]`. | Array |
| Checkable | Shows a checkbox on each node. Checking a parent checks all its children. | On or off. Default: Off |
| Expand all | Opens every branch when the tree first shows. | On or off. Default: On |
| Show line | Draws lines that connect each node to its parent. | On or off. Default: Off |
| Checked keys | Keys of the checked nodes. It updates as the user checks and unchecks nodes. | Array |

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
| On select | Triggers when the user selects or deselects a node. |
| On check | Triggers when the user checks or unchecks a node. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.tree1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.tree1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.tree1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `treeData` | The nodes, each with a `title`, a unique `key` and optional `children`, such as `[{ title: 'Projects', key: 'projects', children: [...] }]`. | `{{components.tree1.treeData}}` |
| `checkable` | Shows a checkbox on each node. Checking a parent checks all its children. | `{{components.tree1.checkable}}` |
| `defaultExpandAll` | Opens every branch when the tree first shows. | `{{components.tree1.defaultExpandAll}}` |
| `showLine` | Draws lines that connect each node to its parent. | `{{components.tree1.showLine}}` |
| `checkedKeys` | Keys of the checked nodes. It updates as the user checks and unchecks nodes. | `{{components.tree1.checkedKeys}}` |
| `selectedKeys` | Keys of the selected nodes, such as `['website']`. | `{{components.tree1.selectedKeys}}` |
| `isVisible` | Whether the component is visible. | `{{components.tree1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.tree1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.tree1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
