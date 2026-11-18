---
id: cascader
title: Cascader
---

<div className="badge badge--primary">Ant Design</div>

The **Cascader** component lets users pick from options nested in levels, one column per level, such as a region, then a country, then a city.

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
| On change | Triggers when the selected path changes, by the user or an action. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Selects the path given as **Value**, a list of values, and fires **On change**. | `components.cascader1.setFieldValue("")` |
| Reset field | Returns the selection to the **Value** property's value. | `components.cascader1.resetFields()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.cascader1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.cascader1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.cascader1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.cascader1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.cascader1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.cascader1.isDisabled}}` |

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
