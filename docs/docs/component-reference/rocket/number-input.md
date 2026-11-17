---
id: number-input
title: Number Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Number Input** component is a field for entering a number, such as a quantity, a price or a percentage. The user can type a value or change it with the step buttons and arrow keys.

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
| On change | Triggers when the number changes. |
| On enter pressed | Triggers when the user presses Enter in the field. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field to the given **Value**. | `components.numberinput1.setText("")` |
| Clear | Empties the field. | `components.numberinput1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.numberinput1.setFocus()` |
| Set blur | Removes focus from the field. | `components.numberinput1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.numberinput1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.numberinput1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.numberinput1.setLoading(false)` |

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
| `isVisible` | Whether the component is visible. | `{{components.numberinput1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.numberinput1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.numberinput1.isDisabled}}` |

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
| Step button background | `transparent` |
| Step button icon color | Theme: Placeholder text |
| Step button hover background | Theme: Surface 3 |
| Prefix and suffix color | Theme: Placeholder text |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
