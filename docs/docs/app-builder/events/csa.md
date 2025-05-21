---
id: csa
title: Controlling Visibility and Interactivity of Components
---

Component-Specific Actions (CSAs) are built-in functions that allow you to control a component state and behavior at runtime. Each component has its own set of CSAs based on its capabilities. 

For example, a Text component supports the `setText()` action, while a Radio Button component offers `selectOption()`. 

You can trigger these actions via event handlers or dynamic expressions in your app. Refer to the individual [component guide](#) for a complete list of supported CSAs.

## Example: Reset Form Input

You can use a button to clear all inputs inside a form by calling the form’s reset action.

Suppose you have a form component named feedbackForm that collects user feedback. To reset all fields when a user clicks a "Clear" button, add the following event handler to the button:
- Event: **On Click**
- Action: **Control Component**
- Component: **feedbackForm** (Select the form component from the dropdown)
- Actions: **Reset Form**

This will reset all inputs inside feedbackForm back to their initial states.

***Add Screenshot***

## Example: Disable Submit Button on Invalid Input

You can use form validation state to dynamically disable the submit button when the input is invalid.

Let’s say you have a form component named **feedbackForm**. To disable the submit button unless the form is valid:
1. Select the Submit button.
2. Click the fx button next to the Disable toggle in the right panel.
3. Add the following expression: `{{!components.form1.isValid}}`

This ensures the submit button is only enabled when the form has passed all validation rules.