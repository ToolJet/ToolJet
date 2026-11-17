---
id: radio-group
title: Radio Group
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Radio Group** component lets the user pick exactly one option from a short visible list, such as a plan, a shipping method or a priority.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the options. | Text. Default: `Label` |
| Help text | Hint text shown under the options. | Text |
| Options | Options to choose from, as plain values or as items with a `label` and a `value` that can add `disabled`. | Array. Default: `["Standard", "Premium", "Charter"]` |
| Default value | Value of the option selected when the app loads. | Text. Default: `Standard` |
| Allow deselect | Lets the user clear the choice by clicking the selected option again. Has no effect when the field is mandatory. | On or off. Default: Off |
| Side by side | Lays the options out in a row instead of a column. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On selection change](../common-settings.md#events) | Triggers when the selected option changes. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Select option | Selects the option with the given **Value**. A value that matches no option is ignored. | `components.radiogroup1.selectOption("")` |
| Deselect option | Clears the selection. | `components.radiogroup1.deselectOption()` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Selected color | Theme: Brand primary |
| Label color | Theme: Primary text |
| Help text color | Theme: Placeholder text |
| Option text color | Theme: Primary text |
| Error color | `var(--cc-error-systemStatus)` |
| Option text color (earlier name) | — |
