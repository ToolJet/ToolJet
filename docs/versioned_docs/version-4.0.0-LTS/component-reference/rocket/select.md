---
id: select
title: Select
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Select** component is a dropdown that lets the user pick one option from a list, such as a status, a category or a customer.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Label` |
| Help text | Hint text shown under the field. | Text |
| Options | Options in the list, as plain values or as items with a `label` and a `value`, such as `[{ label: 'Standard', value: 'std' }]`. | Array. Default: `[{"label": "One", "value": 1}, {"label": "Two", "value": 2}]` |
| Allow clear | Shows a clear button in the field, and lets the user clear the choice by picking the selected option again. Has no effect when the field is mandatory. | On or off. Default: On |
| Placeholder | Text shown in the field when nothing is selected. | Text. Default: `Select an option` |
| Default value | Value of the option selected when the app loads. | Text |

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
| On select | Triggers when the user selects or clears an option. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select option | Selects the option with the given **Value** and fires **On select**. A value that matches no enabled option is ignored. | `components.select1.selectOption("")` |
| Clear | Clears the selection without firing **On select**. | `components.select1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.select1.setFocus()` |
| Set blur | Closes the list and removes focus from the field. | `components.select1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.select1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.select1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.select1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.select1.label}}` |
| `description` | Hint text shown under the field. | `{{components.select1.description}}` |
| `options` | Options in the list, as plain values or as items with a `label` and a `value`, such as `[{ label: 'Standard', value: 'std' }]`. | `{{components.select1.options}}` |
| `allowClear` | Shows a clear button in the field, and lets the user clear the choice by picking the selected option again. Has no effect when the field is mandatory. | `{{components.select1.allowClear}}` |
| `placeholder` | Text shown in the field when nothing is selected. | `{{components.select1.placeholder}}` |
| `defaultValue` | Value of the option selected when the app loads. | `{{components.select1.defaultValue}}` |
| `value` | The value of the selected option, or empty when none is selected. | `{{components.select1.value}}` |
| `selectedOption` | The selected option, with its `label` and `value`. | `{{components.select1.selectedOption}}` |
| `selectedLabel` | The label of the selected option. | `{{components.select1.selectedLabel}}` |
| `isVisible` | Whether the component is visible. | `{{components.select1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.select1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.select1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Field background | Theme: Surface 1 |
| Field text color | Theme: Primary text |
| Placeholder color | Theme: Placeholder text |
| Field border color | Theme: Default border |
| Accent (focus ring, selection) | Theme: Brand primary |
| Error color (message and border) | Theme: Error |
| Field radius | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
