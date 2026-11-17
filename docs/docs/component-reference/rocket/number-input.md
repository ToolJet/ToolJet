---
id: number-input
title: Number Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Number Input** component is a field for entering a number, such as a quantity, a price or a percentage. The user can type a value or change it with the step buttons and arrow keys.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Quantity` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when it is empty. | Text. Default: `0` |
| Default value | Number in the field when the app loads. | Number. Default: `1` |
| Decimal places | Number of digits kept after the decimal point. Values are rounded to this many places. | Number. Default: `2` |
| Step | Amount added or subtracted by each click on a step button or press of the Up and Down arrow keys. | Number. Default: `1` |
| Step buttons | Where the step buttons appear. **Split -/+** puts minus and plus buttons on either side, **Stacked** puts up and down arrows on the right, and **None** hides them. | Split -/+, Stacked, None. Default: Split -/+ |
| Prefix (inside the box) | Text shown inside the field before the number, such as `$`. | Text |
| Suffix (inside the box) | Text shown inside the field after the number, such as `kg` or `%`. | Text |
| Thousands separators | Groups the digits of large numbers with separators, such as `12,500`, while the field isn't being edited. | On or off. Default: On |
| Show clear button | Shows a button in the field that clears the number. | On or off. Default: Off |
| Min value | Lowest allowed number. The step buttons stop here and a smaller number shows an error. Leave empty for no limit. | Text |
| Max value | Highest allowed number. The step buttons stop here and a larger number shows an error. Leave empty for no limit. | Text |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On change](../common-settings.md#events) | Triggers when the number changes. |
| [On enter pressed](../common-settings.md#events) | Triggers when the user presses Enter in the field. |
| [On focus](../common-settings.md#events) | Triggers when the field gets focus. |
| [On blur](../common-settings.md#events) | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field to the given **Value**. | `components.numberinput1.setText("")` |
| Clear | Empties the field. | `components.numberinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.numberinput1.setFocus()` |
| Set blur | Removes focus from the field. | `components.numberinput1.setBlur()` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.numberinput1.label}}` |
| `description` | Hint text shown under the field. | `{{components.numberinput1.description}}` |
| `placeholder` | Text shown in the field when it is empty. | `{{components.numberinput1.placeholder}}` |
| `defaultValue` | Number in the field when the app loads. | `{{components.numberinput1.defaultValue}}` |
| `decimalPlaces` | Number of digits kept after the decimal point. Values are rounded to this many places. | `{{components.numberinput1.decimalPlaces}}` |
| `step` | Amount added or subtracted by each click on a step button or press of the Up and Down arrow keys. | `{{components.numberinput1.step}}` |
| `stepper` | Where the step buttons appear. **Split -/+** puts minus and plus buttons on either side, **Stacked** puts up and down arrows on the right, and **None** hides them. | `{{components.numberinput1.stepper}}` |
| `prefix` | Text shown inside the field before the number, such as `$`. | `{{components.numberinput1.prefix}}` |
| `suffix` | Text shown inside the field after the number, such as `kg` or `%`. | `{{components.numberinput1.suffix}}` |
| `thousandSeparator` | Groups the digits of large numbers with separators, such as `12,500`, while the field isn't being edited. | `{{components.numberinput1.thousandSeparator}}` |
| `showClearBtn` | Shows a button in the field that clears the number. | `{{components.numberinput1.showClearBtn}}` |
| `minValue` | Lowest allowed number. The step buttons stop here and a smaller number shows an error. Leave empty for no limit. | `{{components.numberinput1.minValue}}` |
| `maxValue` | Highest allowed number. The step buttons stop here and a larger number shows an error. Leave empty for no limit. | `{{components.numberinput1.maxValue}}` |
| `value` | The number in the field, or `null` when it is empty. | `{{components.numberinput1.value}}` |

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
| Error color (message and border) | `var(--cc-error-systemStatus)` |
| Field radius | — |
| Step button background | `transparent` |
| Step button icon color | Theme: Placeholder text |
| Step button hover background | Theme: Surface 3 |
| Prefix and suffix color | Theme: Placeholder text |
