---
id: textarea
title: Textarea
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Textarea** component is a multi-line text field for longer input, such as notes, comments or a description.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field. | Text. Default: `Label` |
| Help text | Hint text shown under the field. | Text |
| Placeholder | Text shown in the field when it is empty. | Text. Default: `Enter text` |
| Default value | Text in the field when the app loads. | Text |

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
| On focus | Triggers when the field gets focus. |
| On blur | Triggers when the field loses focus. |
| On change | Triggers when the text in the field changes. |
| On enter pressed | Triggers when the user presses Enter without Shift. The new line is still added. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set text | Sets the field to the given **Text**. | `components.textarea1.setText("")` |
| Clear | Empties the field. | `components.textarea1.clear()` |
| Set focus | Moves keyboard focus to the field. | `components.textarea1.setFocus()` |
| Set blur | Removes focus from the field. | `components.textarea1.setBlur()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.textarea1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.textarea1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.textarea1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field. | `{{components.textarea1.label}}` |
| `description` | Hint text shown under the field. | `{{components.textarea1.description}}` |
| `placeholder` | Text shown in the field when it is empty. | `{{components.textarea1.placeholder}}` |
| `defaultValue` | Text in the field when the app loads. | `{{components.textarea1.defaultValue}}` |
| `value` | The text in the field. | `{{components.textarea1.value}}` |
| `isVisible` | Whether the component is visible. | `{{components.textarea1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.textarea1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.textarea1.isDisabled}}` |

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

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
