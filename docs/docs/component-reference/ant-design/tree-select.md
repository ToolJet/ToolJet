---
id: tree-select
title: Tree Select
---

<div className="badge badge--primary">Ant Design</div>

The **Tree Select** component is Ant Design's dropdown with a tree of options. Users pick from nested choices, such as a team inside a department or a category inside a catalog.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Team` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Tree data | The options, each with a `title`, a `value` and optional `children`, such as `[{ title: 'Engineering', value: 'engineering', children: [...] }]`. A node with `disabled: true` can't be picked. | Array |
| Value | Value of the option picked at the start, or a list of values with **Multiple** or **Tree checkable**. Values the tree doesn't offer are dropped once it loads. | Text |
| Multiple | Lets the user pick several options, shown as tags in the field. | On or off. Default: Off |
| Tree checkable | Shows a checkbox on each option. Checking a parent checks all its children. | On or off. Default: Off |
| Placeholder | Hint text shown while nothing is picked. | Text. Default: `Pick a team` |
| Show search | Lets the user type to filter the options by title. | On or off. Default: On |
| Expand all | Opens every branch when the dropdown opens. | On or off. Default: Off |
| Allow clear | Shows a clear icon in the field once something is picked. | On or off. Default: On |
| Variant | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the picked options change. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Picks the option with the given **Value**, or the options in a list of values. | `components.treeselect1.setFieldValue("")` |
| Reset field | Sets the field back to the **Value** property. | `components.treeselect1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.treeselect1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.treeselect1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.treeselect1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.treeselect1.layout}}` |
| `treeData` | The options, each with a `title`, a `value` and optional `children`, such as `[{ title: 'Engineering', value: 'engineering', children: [...] }]`. A node with `disabled: true` can't be picked. | `{{components.treeselect1.treeData}}` |
| `value` | Value of the option picked at the start, or a list of values with **Multiple** or **Tree checkable**. Values the tree doesn't offer are dropped once it loads. | `{{components.treeselect1.value}}` |
| `multiple` | Lets the user pick several options, shown as tags in the field. | `{{components.treeselect1.multiple}}` |
| `treeCheckable` | Shows a checkbox on each option. Checking a parent checks all its children. | `{{components.treeselect1.treeCheckable}}` |
| `placeholder` | Hint text shown while nothing is picked. | `{{components.treeselect1.placeholder}}` |
| `showSearch` | Lets the user type to filter the options by title. | `{{components.treeselect1.showSearch}}` |
| `treeDefaultExpandAll` | Opens every branch when the dropdown opens. | `{{components.treeselect1.treeDefaultExpandAll}}` |
| `allowClear` | Shows a clear icon in the field once something is picked. | `{{components.treeselect1.allowClear}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.treeselect1.variant}}` |
| `size` | Height and text size of the field. | `{{components.treeselect1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
