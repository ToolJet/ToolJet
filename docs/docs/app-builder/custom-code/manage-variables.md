---
id: managing-variables
title: Manage variables
---

Variables in ToolJet help you bridge data between queries, components, and logic. It allows you to:
- Share state between components: Store values like user inputs, calculated values, or data fetched from queries.
- Trigger conditional logic: Use variables to make decisions in RunJS or workflows.
- Enhance reusability: Set values once, reuse across components and pages.
- Temporarily store data: Store values during the app lifecycle without needing to persist them in a database.

This guide explains how to manage variables using code in your applications.

## Types of variables

There are two types of variables available in ToolJet:
- Variables : Global across all pages. Use these to store values accessible throughout the application.
- Page Variables : Scoped to the current page. Useful for managing data only needed for that specific page.



## Set, Get, and Unset Variables

Setting, getting, and unsetting variables lets you control state of variable. Use set to create variables or update its values, get to access them in components or queries, and unset to clear state when it’s no longer needed. These actions help keep your app logic clean.

### Setting Variables

To set a variable in an application using code for example in a RunJS query, use the `setVariable` function. This function takes two arguments: the name of the variable and its value -   
`actions.setVariable("<variableName>", "<variableValue>")`

For example, if you want to set a global variable named **primaryColor** with the value **#007bff**, you would write:
```js
actions.setVariable('primaryColor', '#007bff');
```

Simlialrly, if you want to set a page variable use the `setPageVariable` function. This function also takes two arguments: the name of the variable and its value -   
`actions.setPageVariable("<variableName>", "<variableValue>")`. 

For example, if you want to set a page variable named userPreference with object with all the user preferences like `{theme:'dark', language:'en'}`, you would write:

```js
actions.setPageVariable('userPreferences', { theme: 'dark', language: 'en' });
```
### Getting Variables
To access variables immediately after setting them in a RunJS query, you can use the `getVariable` and `getPageVariable` functions. These functions take one argument: the name of the variable - `actions.getVariable("<variableName>")` and `actions.getPageVariable("<variableName>")`. 

For example, if you want to get the value of a global variable named primaryColor immediately after setting it, you would write:

```js
actions.setVariable('primaryColor', '#007bff');
return actions.getVariable('primaryColor'); // returns "#007bff"
```

### Unsetting Variables
Now, if you want to unset a variable, you can use the `unsetVariable` and `unsetPageVariable` functions. These functions take one argument: the name of the variable - `actions.unsetVariable("<variableName>")` and `actions.unsetPageVariable("<variableName>")`. 

For example, if you want to unset a page variable named userPreference, you would write:
```js
actions.unsetPageVariable('userPreferences');
```

## Use Cases

### Sharing data across pages

You can share data across different pages by setting a variable on one page and accessing it on another. For instance, if you have a form component on one page where users input their email address, you could save this information as a variable. Then, when navigating to another page (e.g., a confirmation page), you can retrieve the data stored in the variables and display it there.

Here's an example of how you might do this:
```js
// On the first page
actions.setVariable("name", components.emailInput.value);

actions.setVariable("emailAddress", components.nameInput.value);
```

Now on next page if want to show the name or email address then we can simply use `{{variables.name}}` or `{{variables.emailAddress}}` to show in any component.

### Setting up form payload for a multi-step form

If you’re building a multi-step form, each step may require a different set of fields. You can use variables to construct the payload based on the currently active step.

Let’s say your form has three steps: personal details, educational background, and work experience. Each step has its own set of fields. If you want to construct a final payload to be sent as the body when the submit button is clicked on the last step, you can create a RunJS query that checks which step is active and constructs the payload accordingly. Here’s how you might implement this:

```js
let payload = {};
if (components.tabs.currentTab === 0) {
    payload.firstName = components.firstName.value;
    payload.lastName = components.lastName.value;
    payload.email = components.email.value;
} else if (components.tabs.currentTab === 1) {
    payload.educationLevel = components.educationLevel.value;
    payload.major = components.major.value;
    payload.graduationYear = components.graduationYear.value;
} else if (components.tabs.currentTab === 2) {
    payload.companyName = components.companyName.value;
    payload.startDate = components.startDate.value;
    payload.endDate = components.endDate.value;
    payload.jobTitle = components.jobTitle.value;
}
return payload;
```

Now, you can pass this payload to a query that sends it to your backend API endpoint.

Variables help maintain data across pages, while pageVariables help managing localized, page-specific logic. Use pageVariables to handle temporary UI state within a single page, and prefer variables when data needs to persist across multiple pages. Always clean up variables when they’re no longer needed to prevent memory bloat or unexpected behavior. To avoid naming collisions, use clear and descriptive names like *currentUserData* or *invoiceStepOne*.

