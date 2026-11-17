---
id: combobox
title: Combobox
---

<div className="badge badge--primary">Ant Design</div>

The **Combobox** component is a dropdown that users can type in to search its options, such as picking a city or a customer from a long list.

:::info
Every Ant Design component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

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

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the selected option changes, by the user or an action. |
| [On select](../common-settings.md#events) | Triggers when the user picks an option. |
| [On search](../common-settings.md#events) | Triggers when the user types in the field to search. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Selects the option with the given **Value** and fires **On change**. | `components.combobox1.setFieldValue("")` |
| Reset field | Returns the selection to the **Value** property's value. | `components.combobox1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.combobox1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.combobox1.blur()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Primary color | Theme: Brand primary |
| Text color | Theme: Primary text |
| Container background | Theme: Surface 1 |
| Border color | Theme: Default border |
| Border radius | — |
