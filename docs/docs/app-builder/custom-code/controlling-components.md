---
id: control-components
title: Controlling Components Using Code
---

Apart from [**events**](/docs/docs/app-builder/events/use-case/csa.md), Component-Specific Actions (CSAs) can also be triggered using code to modify component properties and state.

Let’s say you want to:
- Reset a form automatically after submission
- Show or hide components based on a condition
- Update a text input based on another field’s value
- Disable a button during API calls
- Change the active tab programmatically

In each of these cases, you can use CSAs with JavaScript or Python queries.

## How It Works

Each component in ToolJet comes with a set of CSAs. Below are some examples of CSAs that can be used in
- setValue() – Sets or updates a component’s value
- clear() – Clears the value of an input
- setLoading() – Sets or unsets the loading state
- setDisable() – Enables or disables a component
- setVisibility() – Dynamically controls component visibility

You can trigger these actions from your JavaScript or Python queries. 

For example, if you have a **Button** that triggers a query and want to show a loader until the data is loaded. You could use `setLoading()` to show a spinner:

```js
await components.button1.setLoading(queries.getData.isLoading)
```

## Use Cases

### Pre-fill a form field based on user selection

When a user selects a product from a **Dropdown**, automatically set the price in a **Text Input** component:

```js
await components.textInput1.setValue(components.dropdown1.value)
```

### Clear fields after submitting a form:

After a user submits a **Form**, reset all inputs:

```js
await components.formInput.resetForm()
```

### Close the modal after Form submission:

If you are using a **Modal** for collecting data, close it once the **Form** has been submitted successfully:

```js
await components.modal1.close()
```

The ability to use CSAs in your code lets you manage a component’s properties based on your own custom logic. 