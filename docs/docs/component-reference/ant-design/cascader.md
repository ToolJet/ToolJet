---
id: cascader
title: Cascader
---

<div className="badge badge--primary">Ant Design</div>

The **Cascader** component lets users pick from options nested in levels, one column per level, such as a region, then a country, then a city.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Location` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Options | The choices, as a list of `{label, value, children}`, where `children` holds the next level's options. Add `disabled: true` to an option that can't be picked. | Array |
| Value | The selected path, as a list of values from the top level down, such as `['asia', 'japan']`. A path the options don't hold is cleared. **Reset field** returns to this value. | Array |
| Placeholder | Hint shown in the field while nothing is selected. | Text. Default: `Pick a city` |
| Expand trigger | Whether the next level opens when the user clicks an option or hovers over it. | `click`, `hover`. Default: `click` |
| Change on select | Lets the user pick an option at any level, not only at the last level. | On or off. Default: Off |
| Show search | Lets the user type to search all paths. | On or off. Default: Off |
| Variant | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `outlined`, `filled`, `borderless`, `underlined`. Default: `outlined` |
| Size | Height and text size of the field. | `small`, `middle`, `large`. Default: `middle` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the selected path changes, by the user or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Selects the path given as **Value**, a list of values, and fires **On change**. | `components.cascader1.setFieldValue("")` |
| Reset field | Returns the selection to the **Value** property's value. | `components.cascader1.resetFields()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.cascader1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.cascader1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.cascader1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.cascader1.layout}}` |
| `options` | The choices, as a list of `{label, value, children}`, where `children` holds the next level's options. Add `disabled: true` to an option that can't be picked. | `{{components.cascader1.options}}` |
| `value` | The selected path, as a list of values from the top level down, such as `['asia', 'japan']`. A path the options don't hold is cleared. **Reset field** returns to this value. | `{{components.cascader1.value}}` |
| `placeholder` | Hint shown in the field while nothing is selected. | `{{components.cascader1.placeholder}}` |
| `expandTrigger` | Whether the next level opens when the user clicks an option or hovers over it. | `{{components.cascader1.expandTrigger}}` |
| `changeOnSelect` | Lets the user pick an option at any level, not only at the last level. | `{{components.cascader1.changeOnSelect}}` |
| `showSearch` | Lets the user type to search all paths. | `{{components.cascader1.showSearch}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.cascader1.variant}}` |
| `size` | Height and text size of the field. | `{{components.cascader1.size}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
