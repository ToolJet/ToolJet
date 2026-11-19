---
id: select
title: Select
---

<div className="badge badge--primary">Ant Design</div>

The **Select** component is Ant Design's dropdown. Users pick one option or several from a list, such as a department or a set of tags, and can type to search when the list is long.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Department` |
| Extra | Help text shown under the field. A validation message replaces it while the value is not valid. | Text |
| Tooltip | Text shown from an info icon after the label. | Text |
| Layout | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `vertical`, `horizontal`. Default: `vertical` |
| Options | The choices, as plain values or as `{ label, value, disabled }` objects, such as `[{ label: 'Design', value: 'design' }]`. | Array |
| Mode | How many options the user picks. Empty means one; `multiple` allows several; `tags` allows several and also lets the user type new values. | Single, Multiple, Tags |
| Value | Value of the option picked at the start, or a list of values in `multiple` and `tags` modes. Values no option offers are dropped once the options load, except in `tags` mode. | Text |
| Placeholder | Hint text shown while nothing is picked. | Text. Default: `Select` |
| Allow clear | Shows a clear icon in the field once something is picked. | On or off. Default: Off |
| Show search | Lets the user type in the field to filter the options by label. | On or off. Default: Off |
| Not found content | Text shown in the dropdown when no option matches the search. | Text. Default: `No options` |
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
| On change | Triggers when the picked value changes, including when it's cleared. |
| On select | Triggers when the user picks an option from the dropdown. |
| On clear | Triggers when the user clears the field with its clear icon. |
| On search | Triggers as the user types in the search box. The text is in **searchValue**. |
| On open change | Triggers when the dropdown opens or closes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Picks the option with the given **Value**, or the options in a list of values in `multiple` and `tags` modes. | `components.select1.setFieldValue("")` |
| Reset field | Sets the field back to the **Value** property. | `components.select1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.select1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.select1.blur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.select1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.select1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.select1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.select1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is not valid. | `{{components.select1.extra}}` |
| `tooltip` | Text shown from an info icon after the label. | `{{components.select1.tooltip}}` |
| `layout` | Where the label sits: `vertical` puts it above the field, `horizontal` puts it to the left. | `{{components.select1.layout}}` |
| `options` | The choices, as plain values or as `{ label, value, disabled }` objects, such as `[{ label: 'Design', value: 'design' }]`. | `{{components.select1.options}}` |
| `mode` | How many options the user picks. Empty means one; `multiple` allows several; `tags` allows several and also lets the user type new values. | `{{components.select1.mode}}` |
| `value` | Value of the option picked at the start, or a list of values in `multiple` and `tags` modes. Values no option offers are dropped once the options load, except in `tags` mode. | `{{components.select1.value}}` |
| `placeholder` | Hint text shown while nothing is picked. | `{{components.select1.placeholder}}` |
| `allowClear` | Shows a clear icon in the field once something is picked. | `{{components.select1.allowClear}}` |
| `showSearch` | Lets the user type in the field to filter the options by label. | `{{components.select1.showSearch}}` |
| `notFoundContent` | Text shown in the dropdown when no option matches the search. | `{{components.select1.notFoundContent}}` |
| `variant` | Border style of the field. `filled` uses a light background, `borderless` has no border, and `underlined` shows only a bottom line. | `{{components.select1.variant}}` |
| `size` | Height and text size of the field. | `{{components.select1.size}}` |
| `selectedOption` | The picked option as `{ label, value }` in single mode, or `{}` when nothing is picked. | `{{components.select1.selectedOption}}` |
| `selectedOptions` | The picked options as `{ label, value }` objects in `multiple` and `tags` modes. | `{{components.select1.selectedOptions}}` |
| `open` | `true` while the dropdown is open. | `{{components.select1.open}}` |
| `searchValue` | Text typed in the search box. It empties when the dropdown closes. | `{{components.select1.searchValue}}` |
| `isVisible` | Whether the component is visible. | `{{components.select1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.select1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.select1.isDisabled}}` |

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
