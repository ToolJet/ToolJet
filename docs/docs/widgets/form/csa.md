---
id: csa
title: CSAs and Exposed Variables
---

This guide covers component-specific actions for the **Form** Component and its exposed variables. To learn how to generate a form, refer to the [Generate Form](/docs/widgets/form/) guide. For more information on **Form** Component Properties, check out the [Properties](/docs/widgets/form/properties) guide.

## Component Specific Actions (CSAs)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"150px"}}> Action </div> | <div style={{ width:"170px"}}> Description </div> | <div style={{width: "200px"}}> RunJS Query </div>|
| :------------ | :---------- | :------------ |
| submitForm() | Submits the form. If **Validate on submit** is enabled and a field is invalid, triggers **On invalid** and shows validation errors; otherwise triggers **On submit** and, if **Reset on submit** is enabled, resets the form afterwards. | `components.form1.submitForm()` |
| resetForm() | Resets all fields in the form to their default values and hides validation errors. | `components.form1.resetForm()` |
| clearForm() | Clears all fields in the form, ignoring their default values, and hides validation errors. | `components.form1.clearForm()` |
| setVisibility()| Sets the visibility of the component.            | `components.form1.setVisibility(false)`   |
| setLoading()   | Sets the loading state of the component.         | `components.form1.setLoading(true)` |
| setDisable()   | Disables the component.                          | `components.form1.setDisable(true)` |

:::info
`resetForm()` restores each field's **Default value**, while `clearForm()` empties every field. Use `clearForm()` when fields have default values that you don't want restored.
:::


## Exposed Variables

| Variable | <div style={{ width:"250px"}}> Description </div> | How To Access |
|:--------|:-----------|:------------|
|  data | Holds all the exposed variables of all the nested components. | `{{components.form1.data}}`|
|  formData  | Holds the value of all the nested components. | `{{components.form1.formData}}` |
|  children  | Holds all the property of all the nested components. | `{{components.form1.children}}` |
|  isValid  | Indicates if all the input meets validation criteria. | `{{components.form1.isValid}}`|
|  isLoading | Indicates if the component is loading. | `{{components.form1.isLoading}}`|
|  isVisible | Indicates if the component is visible. | `{{components.form1.isVisible}}`|
|  isDisabled  | Indicates if the component is disabled. | `{{components.form1.isDisabled}}`|
