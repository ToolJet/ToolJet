---
id: input-number
title: Input Number
---

<div className="badge badge--primary">Ant Design</div>

The **Input Number** component is a field for entering a number, such as a quantity or a price, with up and down buttons to change it by a step.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Quantity` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Value | Number in the field when the app loads. Leave it empty for no number. **Reset field** returns to this value. | Number |
| Placeholder | Hint shown in the field while it is empty. | Text. Default: `0` |
| Min | Lowest number allowed. A smaller value shows a validation error. | Number |
| Max | Highest number allowed. A larger value shows a validation error. | Number |
| Step | How much the up and down buttons and arrow keys change the number. | Number. Default: `1` |
| Precision | Number of decimal places. The value is rounded to it. Leave it empty to keep what the user types. | Number |
| Prefix | Text shown inside the field before the number, such as `$`. | Text |
| Addon before | Text shown in a gray box attached to the start of the field. | Text |
| Addon after | Text shown in a gray box attached to the end of the field, such as a unit like `kg`. | Text |
| Controls | Shows the up and down buttons inside the field. | On or off. Default: On |
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
| On change | Triggers when the number changes, by typing, the step buttons or an action. |
| On step | Triggers when the user changes the number with the up and down buttons or arrow keys. |
| On press enter | Triggers when the user presses Enter in the field. |
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the number to the given **Value** and fires **On change**. | `components.inputnumber1.setFieldValue("")` |
| Reset field | Returns the number to the **Value** property's value. | `components.inputnumber1.resetFields()` |
| Focus | Moves keyboard focus to the field. | `components.inputnumber1.focus()` |
| Blur | Removes keyboard focus from the field. | `components.inputnumber1.blur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.inputnumber1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.inputnumber1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.inputnumber1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.inputnumber1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.inputnumber1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.inputnumber1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.inputnumber1.layout}}` |
| `value` | Number in the field when the app loads. Leave it empty for no number. **Reset field** returns to this value. | `{{components.inputnumber1.value}}` |
| `placeholder` | Hint shown in the field while it is empty. | `{{components.inputnumber1.placeholder}}` |
| `min` | Lowest number allowed. A smaller value shows a validation error. | `{{components.inputnumber1.min}}` |
| `max` | Highest number allowed. A larger value shows a validation error. | `{{components.inputnumber1.max}}` |
| `step` | How much the up and down buttons and arrow keys change the number. | `{{components.inputnumber1.step}}` |
| `precision` | Number of decimal places. The value is rounded to it. Leave it empty to keep what the user types. | `{{components.inputnumber1.precision}}` |
| `prefix` | Text shown inside the field before the number, such as `$`. | `{{components.inputnumber1.prefix}}` |
| `addonBefore` | Text shown in a gray box attached to the start of the field. | `{{components.inputnumber1.addonBefore}}` |
| `addonAfter` | Text shown in a gray box attached to the end of the field, such as a unit like `kg`. | `{{components.inputnumber1.addonAfter}}` |
| `controls` | Shows the up and down buttons inside the field. | `{{components.inputnumber1.controls}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.inputnumber1.variant}}` |
| `size` | Height and text size of the field. | `{{components.inputnumber1.size}}` |
| `isVisible` | Whether the component is visible. | `{{components.inputnumber1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.inputnumber1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.inputnumber1.isDisabled}}` |

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
