---
id: form
title: Form
---

<div className="badge badge--primary">Rocket 2.0</div>

The **Form** component builds a form from a list of fields, such as a contact or request form. It checks required fields, emails and numbers, and fires **On submit** only when every field is valid.

:::info
Every Rocket 2.0 component also has the [common settings](../common-settings.md): Visibility, Disable, Loading and Devices, the actions and exposed variables that go with them, and Box shadow. They are not repeated here.
:::

## Properties

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"300px"}}> Description </div> | <div style={{ width:"200px"}}> Expected Value </div> |
|:--|:--|:--|
| Title | Heading shown at the top of the form. Leave it empty to hide it. | Text. Default: `Contact us` |
| Fields | The form's fields, as a list of `{ name, label, type, required, placeholder, options }`. **type** is `text`, `email`, `number`, `textarea`, `select`, `checkbox` or `date`, and `options` lists the choices of a `select`. | Array |
| Default values | Starting values, as an object of field name to value. **Reset** returns the form to these values. | Object |
| Submit button | Text on the submit button. | Text. Default: `Submit` |
| Show reset button | Shows a **Reset** button next to the submit button. | On or off. Default: On |
| Disable | Turns off every field and both buttons. | On or off. Default: Off |

## Events

| <div style={{ width:"180px"}}> Event </div> | <div style={{ width:"420px"}}> Description </div> |
|:--|:--|
| [On submit](../common-settings.md#events) | Triggers when the form is submitted and every field is valid. |
| [On change](../common-settings.md#events) | Triggers when the user changes any field. |
| [On reset](../common-settings.md#events) | Triggers when the form is reset. |

## Component Specific Actions (CSA)

Run these from an event handler with **Control Component**, or from a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"250px"}}> Description </div> | <div style={{ width:"250px"}}> How To Access </div> |
|:--|:--|:--|
| Submit | Checks every field and shows their errors, then fires **On submit** if all are valid. | `components.form1.submit()` |
| Reset | Returns every field to its default value and clears the errors shown. | `components.form1.reset()` |
| Set values | Fills fields from an object of field name to value, passed as **Values (object)**. Fields not in the object keep their values. | `components.form1.setValues("")` |

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

## Styles

| <div style={{ width:"250px"}}> Style </div> | <div style={{ width:"250px"}}> Default </div> |
|:--|:--|
| Button | Theme: Brand primary |
| Field spacing | `12` |
| Label position | Top |
