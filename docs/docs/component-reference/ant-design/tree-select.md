---
id: tree-select
title: Tree Select
---

<div className="badge badge--primary">Ant Design</div>

The **Tree Select** component is Ant Design's dropdown with a tree of options. Users pick from nested choices, such as a team inside a department or a category inside a catalog.

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

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |
| Disable | Stops the user from interacting with the component. | On or off. Default: Off |
| Dynamic height | Lets the component grow with its content in the running app instead of keeping a fixed height. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On change | Triggers when the picked options change. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Picks the option with the given **Value**, or the options in a list of values. | `components.treeselect1.setFieldValue("")` |
| Reset field | Sets the field back to the **Value** property. | `components.treeselect1.resetFields()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.treeselect1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.treeselect1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.treeselect1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.treeselect1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.treeselect1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.treeselect1.isDisabled}}` |

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
