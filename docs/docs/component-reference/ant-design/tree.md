---
id: tree
title: Tree
---

<div className="badge badge--primary">Ant Design</div>

The **Tree** component is Ant Design's tree view. It shows nested items, such as folders, categories or an org chart, that users expand, select and optionally check.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Tree data | The nodes, each with a `title`, a unique `key` and optional `children`, such as `[{ title: 'Projects', key: 'projects', children: [...] }]`. | Array |
| Checkable | Shows a checkbox on each node. Checking a parent checks all its children. | On or off. Default: Off |
| Expand all | Opens every branch when the tree first shows. | On or off. Default: On |
| Show line | Draws lines that connect each node to its parent. | On or off. Default: Off |
| Checked keys | Keys of the checked nodes. It updates as the user checks and unchecks nodes. | Array |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the user selects or deselects a node. |
| [On check](../common-settings.md#events) | Triggers when the user checks or unchecks a node. |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `treeData` | The nodes, each with a `title`, a unique `key` and optional `children`, such as `[{ title: 'Projects', key: 'projects', children: [...] }]`. | `{{components.tree1.treeData}}` |
| `checkable` | Shows a checkbox on each node. Checking a parent checks all its children. | `{{components.tree1.checkable}}` |
| `defaultExpandAll` | Opens every branch when the tree first shows. | `{{components.tree1.defaultExpandAll}}` |
| `showLine` | Draws lines that connect each node to its parent. | `{{components.tree1.showLine}}` |
| `checkedKeys` | Keys of the checked nodes. It updates as the user checks and unchecks nodes. | `{{components.tree1.checkedKeys}}` |
| `selectedKeys` | Keys of the selected nodes, such as `['website']`. | `{{components.tree1.selectedKeys}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
