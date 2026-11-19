---
id: radio-group
title: Radio Group
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Radio Group** component lets the user pick exactly one option from a short visible list, such as a plan, a shipping method or a priority.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the options. | Text. Default: `Label` |
| Help text | Hint text shown under the options. | Text |
| Options | Options to choose from, as plain values or as items with a `label` and a `value` that can add `disabled`. | Array. Default: `["Standard", "Premium", "Charter"]` |
| Default value | Value of the option selected when the app loads. | Text. Default: `Standard` |
| Allow deselect | Lets the user clear the choice by clicking the selected option again. Has no effect when the field is mandatory. | On or off. Default: Off |
| Side by side | Lays the options out in a row instead of a column. | On or off. Default: Off |

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
| On selection change | Triggers when the selected option changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select option | Selects the option with the given **Value**. A value that matches no option is ignored. | `components.radiogroup1.selectOption("")` |
| Deselect option | Clears the selection. | `components.radiogroup1.deselectOption()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.radiogroup1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.radiogroup1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.radiogroup1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the options. | `{{components.radiogroup1.label}}` |
| `description` | Hint text shown under the options. | `{{components.radiogroup1.description}}` |
| `options` | Options to choose from, as plain values or as items with a `label` and a `value` that can add `disabled`. | `{{components.radiogroup1.options}}` |
| `defaultValue` | Value of the option selected when the app loads. | `{{components.radiogroup1.defaultValue}}` |
| `allowDeselect` | Lets the user clear the choice by clicking the selected option again. Has no effect when the field is mandatory. | `{{components.radiogroup1.allowDeselect}}` |
| `horizontal` | Lays the options out in a row instead of a column. | `{{components.radiogroup1.horizontal}}` |
| `value` | The value of the selected option, or empty when none is selected. | `{{components.radiogroup1.value}}` |
| `selectedOption` | The selected option, with its `label` and `value`. | `{{components.radiogroup1.selectedOption}}` |
| `isVisible` | Whether the component is visible. | `{{components.radiogroup1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.radiogroup1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.radiogroup1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Selected color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Option text color | Theme: Primary text |
| Error color | Theme: Error |
| Option text color (earlier name) | — |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until the style is set to another value. See [App Themes](../../app-builder/custom-theme.md).
