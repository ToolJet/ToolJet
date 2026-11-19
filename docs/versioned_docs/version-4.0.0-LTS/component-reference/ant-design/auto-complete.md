---
id: auto-complete
title: Auto Complete
---

<div className="badge badge--primary">Ant Design</div>

The **Auto Complete** component is a text field that suggests matching options as the user types, while still accepting any text, such as a product name or a city.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Label | Text shown above the field, or beside it when **Layout** is `horizontal`. | Text. Default: `Product` |
| Extra | Help text shown under the field. A validation message replaces it while the value is invalid. | Text |
| Tooltip | Text shown when the user hovers over an info icon after the label. | Text |
| Layout | `vertical` puts the label above the field; `horizontal` puts it at the left. | `vertical`, `horizontal`. Default: `vertical` |
| Options | Suggestions to show, as plain text values or a list of `{label, value}`. Picking one fills the field with its value. Add `disabled: true` to show an option that can't be picked. | Array |
| Value | Text in the field when the app loads. **Reset field** returns to this value. | Text |
| Placeholder | Hint shown in the field while it is empty. | Text. Default: `Start typing` |
| Filter option | Shows only the suggestions that contain the typed text. Turn it off to show every option, for example when a query fetches suggestions as the user types. | On or off. Default: On |
| Allow clear | Shows a button in the field that clears the text. | On or off. Default: Off |
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
| On change | Triggers when the text changes, by typing, picking a suggestion or an action. |
| On select | Triggers when the user picks a suggestion. |
| On search | Triggers when the user types in the field. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Set field value | Changes the text to the given **Value** and fires **On change**. | `components.autocomplete1.setFieldValue("")` |
| Reset field | Returns the text to the **Value** property's value. | `components.autocomplete1.resetFields()` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.autocomplete1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.autocomplete1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.autocomplete1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `label` | Text shown above the field, or beside it when **Layout** is `horizontal`. | `{{components.autocomplete1.label}}` |
| `extra` | Help text shown under the field. A validation message replaces it while the value is invalid. | `{{components.autocomplete1.extra}}` |
| `tooltip` | Text shown when the user hovers over an info icon after the label. | `{{components.autocomplete1.tooltip}}` |
| `layout` | `vertical` puts the label above the field; `horizontal` puts it at the left. | `{{components.autocomplete1.layout}}` |
| `options` | Suggestions to show, as plain text values or a list of `{label, value}`. Picking one fills the field with its value. Add `disabled: true` to show an option that can't be picked. | `{{components.autocomplete1.options}}` |
| `value` | Text in the field when the app loads. **Reset field** returns to this value. | `{{components.autocomplete1.value}}` |
| `placeholder` | Hint shown in the field while it is empty. | `{{components.autocomplete1.placeholder}}` |
| `filterOption` | Shows only the suggestions that contain the typed text. Turn it off to show every option, for example when a query fetches suggestions as the user types. | `{{components.autocomplete1.filterOption}}` |
| `allowClear` | Shows a button in the field that clears the text. | `{{components.autocomplete1.allowClear}}` |
| `variant` | Style of the field box. `outlined` has a border, `filled` has a gray fill, `borderless` has neither, and `underlined` has only a bottom line. | `{{components.autocomplete1.variant}}` |
| `size` | Height and text size of the field. | `{{components.autocomplete1.size}}` |
| `isVisible` | Whether the component is visible. | `{{components.autocomplete1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.autocomplete1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.autocomplete1.isDisabled}}` |

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
