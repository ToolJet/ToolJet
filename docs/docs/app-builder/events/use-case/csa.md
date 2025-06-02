---
id: csa
title: Control Component State
---

Component-Specific Actions (CSAs) are built-in functions that allow you to control a component state and behavior in the application. Each component has its own set of CSAs based on its capabilities. 

For example, a Text component supports the `setText()` action, while a Radio Button component offers `selectOption()`. 

You can trigger these actions via event handlers or by using expressions in your queries. Refer to the individual [component guide](#) for a complete list of supported CSAs.

## Controlling Components

Suppose you've built a feedback form and want to clear all inputs after the data is submitted to the database. ToolJet provides a `resetForm` function to help with this, which can be triggered in two ways:
- [Using an Event Handler](#using-an-event-handler)
- [Using a JS Expression in a Query](#using-a-javascript-expression-in-a-query)

### Using an Event Handler

Suppose you have a query named **addData**, which is being used to insert the form data into the database. To clear the form using an event handler, add the following configuration to your **addData** query:
- Event: **Query Success**
- Action: **Control Component**
- Component: **feedbackForm** (Select your component from the dropdown)
- Actions: **Reset Form**

### Using a JavaScript Expression in a Query

Alternatively, you can reset the form directly within your query by appending this JavaScript expression:

```js
await components.feedbackForm.resetForm()
```
