---
id: combobox
title: Combobox
---

<div className="badge badge--primary">Ant Design</div>

The **Combobox** component is a dropdown that users can type in to search its options, such as picking a city or a customer from a long list.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `City` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Options | The choices, as plain values or a list of `{label, value}`. Add `disabled: true` to show an option that can't be picked. | Array |
| Value | Value of the option selected when the app loads. A value no option has is cleared. **Reset field** returns to this value. | Text |
| Placeholder | Hint shown in the field while nothing is selected. | Text. Default: `Search` |
| Not found content | Message shown in the list when no option matches the search. | Text. Default: `No matches` |
| Allow clear | Shows a button in the field that clears the selection. | On or off. Default: On |
| Filter option | Shows only the options whose label contains the typed text. Turn it off when a query fetches the options as the user types, reading `searchValue`. | On or off. Default: On |
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
| On change | Triggers when the selected option changes, by the user or an action. |
| On select | Triggers when the user picks an option. |
| On search | Triggers when the user types in the field to search. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Selects the option with the given **Value** and fires **On change**. | `components.combobox1.setFieldValue("")` |
| Reset field | Returns the selection to the **Value** property's value. | `components.combobox1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.combobox1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.combobox1.blur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.combobox1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.combobox1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.combobox1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.combobox1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.combobox1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.combobox1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.combobox1.layout}}` |
| `options` | The choices, as plain values or a list of `{label, value}`. Add `disabled: true` to show an option that can't be picked. | `{{components.combobox1.options}}` |
| `value` | Value of the option selected when the app loads. A value no option has is cleared. **Reset field** returns to this value. | `{{components.combobox1.value}}` |
| `placeholder` | Hint shown in the field while nothing is selected. | `{{components.combobox1.placeholder}}` |
| `notFoundContent` | Message shown in the list when no option matches the search. | `{{components.combobox1.notFoundContent}}` |
| `allowClear` | Shows a button in the field that clears the selection. | `{{components.combobox1.allowClear}}` |
| `filterOption` | Shows only the options whose label contains the typed text. Turn it off when a query fetches the options as the user types, reading `searchValue`. | `{{components.combobox1.filterOption}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.combobox1.variant}}` |
| `size` | Height and text size of the field. | `{{components.combobox1.size}}` |
| `selectedOption` | The selected option, as `{label, value}`. It is empty when nothing is selected. | `{{components.combobox1.selectedOption}}` |
| `selectedLabel` | Label of the selected option. | `{{components.combobox1.selectedLabel}}` |
| `searchValue` | Text the user has typed to search. It empties when the list closes. | `{{components.combobox1.searchValue}}` |
| `isVisible` | Whether the component is visible. | `{{components.combobox1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.combobox1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.combobox1.isDisabled}}` |

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
