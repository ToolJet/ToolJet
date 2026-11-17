---
id: multi-select
title: Multi Select
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Multi Select** component lets the user pick several options from a dropdown list, such as teams, tags or regions. Picked options show as removable chips in the field.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Teams` |
| Help text | Hint text shown under the field. | Text |
| Options | Options in the list. Each option has a `label` and a `value`, and can add a `description`, `icon`, `group` or `disabled`. | Array |
| Placeholder | Text shown in the field when nothing is selected. | Text. Default: `Select teams...` |
| Search placeholder | Hint text shown in the empty search box at the top of the list. | Text. Default: `Search teams...` |
| No results text | Message shown in the list when no option matches the search. | Text. Default: `No team found.` |
| Show search | Shows a search box at the top of the list that filters the options as the user types. | On or off. Default: On |
| Server-side search (options already filtered by searchText) | Stops the component from filtering the options itself. Use a query that reads **searchText** and returns the matching options. | On or off. Default: Off |
| Show clear button | Shows a button in the field that clears the whole selection. | On or off. Default: On |
| Options loading state | Shows a loading indicator in the list, for example while a query fetches the options. | On or off. Default: Off |
| Default values | Values of the options selected when the app loads. | Array. Default: `["design", "engineering"]` |
| Show select all | Shows a **Select all** option at the top of the list. It is hidden while the user searches or when **Max selections** is set. | On or off. Default: On |
| Max visible chips (0 shows all) | Number of chips shown in the field before the rest collapse into a `+N more` chip. `0` shows all of them. | Number. Default: `3` |
| Max selections (0 for no limit) | Most options the user can select. Once reached, the other options are disabled. `0` means no limit. | Number. Default: `0` |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On select](../common-settings.md#events) | Triggers when the user selects or deselects an option. |
| [On search text changed](../common-settings.md#events) | Triggers when the user types in the search box. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select options | Adds the options with the given **Values** to the selection. | `components.multiselect1.selectOptions("")` |
| Deselect options | Removes the options with the given **Values** from the selection. | `components.multiselect1.deselectOptions("")` |
| Clear | Clears the selection. | `components.multiselect1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.multiselect1.setFocus()` |
| Set blur | Closes the list and removes focus from the field. | `components.multiselect1.setBlur()` |
| Set values | Replaces the selection with the options whose values are in the given array. | `components.multiselect1.setValues("")` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.multiselect1.label}}` |
| `description` | Hint text shown under the field. | `{{components.multiselect1.description}}` |
| `options` | Options in the list. Each option has a `label` and a `value`, and can add a `description`, `icon`, `group` or `disabled`. | `{{components.multiselect1.options}}` |
| `placeholder` | Text shown in the field when nothing is selected. | `{{components.multiselect1.placeholder}}` |
| `searchPlaceholder` | Hint text shown in the empty search box at the top of the list. | `{{components.multiselect1.searchPlaceholder}}` |
| `emptyText` | Message shown in the list when no option matches the search. | `{{components.multiselect1.emptyText}}` |
| `showSearch` | Shows a search box at the top of the list that filters the options as the user types. | `{{components.multiselect1.showSearch}}` |
| `serverSideSearch` | Stops the component from filtering the options itself. Use a query that reads **searchText** and returns the matching options. | `{{components.multiselect1.serverSideSearch}}` |
| `showClearBtn` | Shows a button in the field that clears the whole selection. | `{{components.multiselect1.showClearBtn}}` |
| `optionsLoadingState` | Shows a loading indicator in the list, for example while a query fetches the options. | `{{components.multiselect1.optionsLoadingState}}` |
| `defaultValue` | Values of the options selected when the app loads. | `{{components.multiselect1.defaultValue}}` |
| `showSelectAll` | Shows a **Select all** option at the top of the list. It is hidden while the user searches or when **Max selections** is set. | `{{components.multiselect1.showSelectAll}}` |
| `maxVisibleChips` | Number of chips shown in the field before the rest collapse into a `+N more` chip. `0` shows all of them. | `{{components.multiselect1.maxVisibleChips}}` |
| `maxSelections` | Most options the user can select. Once reached, the other options are disabled. `0` means no limit. | `{{components.multiselect1.maxSelections}}` |
| `values` | The values of the selected options. | `{{components.multiselect1.values}}` |
| `selectedOptions` | The selected options, each with its `label` and `value`. | `{{components.multiselect1.selectedOptions}}` |
| `searchText` | The text the user has typed in the search box. | `{{components.multiselect1.searchText}}` |

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
| Chip background | Theme: Surface 3 |
| Chip text color | Theme: Primary text |
| Menu background | Theme: Surface 1 |
| Menu text color | Theme: Primary text |
| Highlighted option background | Theme: Surface 3 |
| Chip background (earlier name) | — |
