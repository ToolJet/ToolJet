---
id: form
title: Form
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Form** component builds a form from a list of fields, such as a contact or request form. It checks required fields, emails and numbers, and fires **On submit** only when every field is valid.

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Heading shown at the top of the form. Leave it empty to hide it. | Text. Default: `Contact us` |
| Fields | The form's fields, as a list of `{ name, label, type, required, placeholder, options }`. **type** is `text`, `email`, `number`, `textarea`, `select`, `checkbox` or `date`, and `options` lists the choices of a `select`. | Array |
| Default values | Starting values, as an object of field name to value. **Reset** returns the form to these values. | Object |
| Submit button | Text on the submit button. | Text. Default: `Submit` |
| Show reset button | Shows a **Reset** button next to the submit button. | On or off. Default: On |
| Disable | Turns off every field and both buttons. | On or off. Default: Off |

### Additional Actions

Each of these can be switched on or off, or set with a logical expression by clicking **fx**.

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Visibility | Shows or hides the component. Hidden components keep their space unless Collapse when hidden is on. | On or off. Default: On |
| Collapse when hidden | Removes the hidden component's space, so the components below it move up. | On or off. Default: Off |
| Loading state | Shows the component's loading look and blocks interaction, for example while a query runs. | On or off. Default: Off |

### Devices

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Show on desktop | Shows the component in the desktop layout. | On or off. Default: On |
| Show on mobile | Shows the component in the mobile layout. | On or off. Default: Off |

## Events

Add a handler from the **Events** section of the properties panel. See [Event Triggers](../../app-builder/events/event-triggers.md) for the steps.

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| On submit | Triggers when the form is submitted and every field is valid. |
| On change | Triggers when the user changes any field. |
| On reset | Triggers when the form is reset. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query. See [Component Specific Actions](../../app-builder/events/use-case/csa.md).

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Submit | Checks every field and shows their errors, then fires **On submit** if all are valid. | `components.form1.submit()` |
| Reset | Returns every field to its default value and clears the errors shown. | `components.form1.reset()` |
| Set values | Fills fields from an object of field name to value, passed as **Values (object)**. Fields not in the object keep their values. | `components.form1.setValues("")` |
| Set visibility | Shows the component when `true`, hides it when `false`. | `components.form1.setVisibility(false)` |
| Set disable | Disables the component when `true`, enables it when `false`. | `components.form1.setDisable(false)` |
| Set loading | Turns the loading state on with `true`, off with `false`. | `components.form1.setLoading(false)` |

## Exposed Variables

| <div style={{ width:"150px"}}> Variable </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| `title` | Heading shown at the top of the form. Leave it empty to hide it. | `{{components.form1.title}}` |
| `fields` | The form's fields, as a list of `{ name, label, type, required, placeholder, options }`. **type** is `text`, `email`, `number`, `textarea`, `select`, `checkbox` or `date`, and `options` lists the choices of a `select`. | `{{components.form1.fields}}` |
| `defaultValues` | Starting values, as an object of field name to value. **Reset** returns the form to these values. | `{{components.form1.defaultValues}}` |
| `submitLabel` | Text on the submit button. | `{{components.form1.submitLabel}}` |
| `showReset` | Shows a **Reset** button next to the submit button. | `{{components.form1.showReset}}` |
| `disabled` | Turns off every field and both buttons. | `{{components.form1.disabled}}` |
| `data` | Current values of the form, as an object of field name to value. | `{{components.form1.data}}` |
| `isValid` | `true` when every field passes its checks. | `{{components.form1.isValid}}` |
| `errors` | Error message for each invalid field, keyed by field name. | `{{components.form1.errors}}` |
| `isVisible` | Whether the component is visible. | `{{components.form1.isVisible}}` |
| `isLoading` | Whether the component is in its loading state. | `{{components.form1.isLoading}}` |
| `isDisabled` | Whether the component is disabled. | `{{components.form1.isDisabled}}` |

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Button | Theme: Brand primary |
| Field spacing | `12` |
| Label position | Top |
| Box shadow | `0px 0px 0px 0px #00000040` |

A default that starts with **Theme:** follows the app's theme until you set the style yourself. See [App Themes](../../app-builder/custom-theme.md).
