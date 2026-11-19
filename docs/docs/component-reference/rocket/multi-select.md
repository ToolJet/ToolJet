---
id: multi-select
title: Multi Select
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Multi Select** component lets the user pick several options from a dropdown list, such as teams, tags or regions. Picked options show as removable chips in the field.

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
| On select | Triggers when the user selects or deselects an option. |
| On search text changed | Triggers when the user types in the search box. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select options | Adds the options with the given **Values** to the selection. | `components.multiselect1.selectOptions("")` |
| Deselect options | Removes the options with the given **Values** from the selection. | `components.multiselect1.deselectOptions("")` |
| Clear | Clears the selection. | `components.multiselect1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.multiselect1.setFocus()` |
| Set blur | Closes the list and removes focus from the field. | `components.multiselect1.setBlur()` |
| Set values | Replaces the selection with the options whose values are in the given array. | `components.multiselect1.setValues("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.multiselect1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.multiselect1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.multiselect1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.multiselect1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.multiselect1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.multiselect1.isDisabled}}` |

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
| Error color (message and border) | Theme: Error |
| Field radius | — |
| Chip background | Theme: Surface 3 |
| Chip text color | Theme: Primary text |
| Menu background | Theme: Surface 1 |
| Menu text color | Theme: Primary text |
| Highlighted option background | Theme: Surface 3 |
| Chip background (earlier name) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
