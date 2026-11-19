---
id: input
title: Input
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Input** component is a single-line text field with a label, for entering names, emails, numbers, passwords or search terms. **Email** and **URL** types check the format of what the user types.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Label shown above the field. | Text. Default: `Label` |
| Help text | Help text shown under the field. | Text |
| Placeholder | Hint text shown while the field is empty. | Text. Default: `Enter text` |
| Default value | Text the field starts with. Changing it replaces the current value. | Text |
| Type | Kind of value the field takes. **Email** and **URL** show an error for a badly formed value, **Number** gives a number, **Password** hides the text, and **Search** adds a clear button and clears on `Escape`. | Text, Email, URL, Number, Password, Search, Phone. Default: Text |
| Show clear button | Shows a button that empties the field while it has text. | On or off. Default: Off |

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
| On focus | Triggers when the field gains focus. |
| On blur | Triggers when the field loses focus. |
| On change | Triggers when the field's value changes. |
| On enter pressed | Triggers when the user presses `Enter` in the field. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field's value to **Text**. | `components.input1.setText("")` |
| Clear | Empties the field. | `components.input1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.input1.setFocus()` |
| Set blur | Removes keyboard focus from the field. | `components.input1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.input1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.input1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.input1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Label shown above the field. | `{{components.input1.label}}` |
| `description` | Help text shown under the field. | `{{components.input1.description}}` |
| `placeholder` | Hint text shown while the field is empty. | `{{components.input1.placeholder}}` |
| `defaultValue` | Text the field starts with. Changing it replaces the current value. | `{{components.input1.defaultValue}}` |
| `inputType` | Kind of value the field takes. **Email** and **URL** show an error for a badly formed value, **Number** gives a number, **Password** hides the text, and **Search** adds a clear button and clears on `Escape`. | `{{components.input1.inputType}}` |
| `showClearBtn` | Shows a button that empties the field while it has text. | `{{components.input1.showClearBtn}}` |
| `value` | Current value of the field. With **Type** set to **Number**, it is a number, or `null` when empty. | `{{components.input1.value}}` |
| `isVisible` | Whether the component is visible. | `{{components.input1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.input1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.input1.isDisabled}}` |

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
