---
id: control-components
title: Controlling Components Using Code
---

In ToolJet, components can be controlled using code, enabling you to build interactive UIs. This is made possible through Component-Specific Actions (CSAs), which allow you to modify a component’s properties like value, loading state, and other component properties in the app.

Let’s say you want to:
- Automatically reset a form after submission.
- Show or hide a component based on a condition.
- Update the value of a text input based on another field.
- Disable a button during API calls.
- Change tab selection programmatically.

In each of these cases, CSAs help you control components using simple JavaScript logic.

## How It Works

Each component in ToolJet comes with a set of Component-Specific Actions (CSAs) as follows:
- setValue(): Set or update a component’s value.
- clear(): Clear the value of an input.
- setLoading(): Set or unset the loading state of a component.
- setDisable(true/false): Enable/disable a component.
- setVisibility(true/false): Dynamically control visibility.

You can trigger these actions from within your app by writing JavaScript code. 

For example, if you have a button that triggers an API call and want to show a loader till the time data is loaded. You could use `setLoading()` to show a spinner. You can use this code snippet as follows:

```js
await components.button1.setLoading(true)
```

## Use Cases

### Pre-fill a form field based on user selection

When a user selects a product from a dropdown, automatically set the price in a text input:

```js
await components.textInput1.setValue(components.dropdown1.value)
```

### Clear fields after submitting a form:

After a user submits a form, reset all inputs:

```js
await components.nameInput.clear()
await components.emailInput.clear()
await components.commentsInput.clear()
```
### Close the modal after form submission:

If you are using a modal for collecting data, close it once the form has been submitted successfully:

```js
await components.modal1.close()
```

Along with the power of low-code, ToolJet also lets you control components using code. This means you can manage a component’s properties based on your own custom logic. With a few lines of JavaScript, you can show or hide components, set values, and handle actions more easily. It’s a simple way to make your app more interactive and responsive to your users.