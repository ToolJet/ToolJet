---
id: combobox
title: Combobox
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Combobox** component is a dropdown with a search box for picking one option from a long list, such as a country or customer. Options can have descriptions, icons and group headings.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Country` |
| Help text | Help text shown under the field. | Text |
| Options | The options to choose from: plain values, or objects with `label` and `value` and optional `description`, `icon`, `group` and `disabled`. | Array |
| Placeholder | Text shown in the field when nothing is selected. | Text. Default: `Select a country...` |
| Search placeholder | Hint text shown in the search box. | Text. Default: `Search countries...` |
| No results text | Text shown when no option matches the search. | Text. Default: `No country found.` |
| Show search | Shows a search box at the top of the option list. | On or off. Default: On |
| Server-side search (options already filtered by searchText) | Stops the component from filtering options itself. Use a query that filters the options by `searchText` instead. | On or off. Default: Off |
| Show clear button | Shows a button that clears the selection. | On or off. Default: On |
| Options loading state | Shows a loading indicator in the option list, such as while a query fetches options. | On or off. Default: Off |
| Default value | The value of the option selected when the app loads. Changing it resets the selection. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the user selects an option or clears the selection. |
| [On search text changed](../common-settings.md#events) | Triggers when the user changes the text in the search box. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select option | Selects the option whose value is **Value**, and fires **On select** if the selection changes. | `components.combobox1.selectOption("")` |
| Clear | Clears the selection. | `components.combobox1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.combobox1.setFocus()` |
| Set blur | Closes the option list and removes keyboard focus from the field. | `components.combobox1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.combobox1.label}}` |
| `description` | Help text shown under the field. | `{{components.combobox1.description}}` |
| `options` | The options to choose from: plain values, or objects with `label` and `value` and optional `description`, `icon`, `group` and `disabled`. | `{{components.combobox1.options}}` |
| `placeholder` | Text shown in the field when nothing is selected. | `{{components.combobox1.placeholder}}` |
| `searchPlaceholder` | Hint text shown in the search box. | `{{components.combobox1.searchPlaceholder}}` |
| `emptyText` | Text shown when no option matches the search. | `{{components.combobox1.emptyText}}` |
| `showSearch` | Shows a search box at the top of the option list. | `{{components.combobox1.showSearch}}` |
| `serverSideSearch` | Stops the component from filtering options itself. Use a query that filters the options by `searchText` instead. | `{{components.combobox1.serverSideSearch}}` |
| `showClearBtn` | Shows a button that clears the selection. | `{{components.combobox1.showClearBtn}}` |
| `optionsLoadingState` | Shows a loading indicator in the option list, such as while a query fetches options. | `{{components.combobox1.optionsLoadingState}}` |
| `defaultValue` | The value of the option selected when the app loads. Changing it resets the selection. | `{{components.combobox1.defaultValue}}` |
| `value` | The value of the selected option, or empty when nothing is selected. | `{{components.combobox1.value}}` |
| `selectedOption` | The whole selected option, with its `label`, `value` and other fields. | `{{components.combobox1.selectedOption}}` |
| `selectedLabel` | The label of the selected option. | `{{components.combobox1.selectedLabel}}` |
| `searchText` | The text in the search box now. | `{{components.combobox1.searchText}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Field background | Theme: Surface 1 |
| Field text color | Theme: Primary text |
| Placeholder color | Theme: Placeholder text |
| Field border color | Theme: Default border |
| Accent (focus ring, checks) | Theme: Brand primary |
| Error color (message and border) | `var(--cc-error-systemStatus)` |
| Field radius | — |
| Menu background | Theme: Surface 1 |
| Menu text color | Theme: Primary text |
| Highlighted option background | Theme: Surface 3 |
