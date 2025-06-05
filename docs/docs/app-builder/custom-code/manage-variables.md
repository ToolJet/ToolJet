---
id: managing-variables
title: Manage variables
---

Variables in ToolJet helps you bridge data between queries, components, and logic. You can learn more about variables and its types [here](/docs/app-builder/events/variables).

This guide explains how to manage variables using code in your applications.

## Set, Get, and Unset Variables

Setting, getting, and unsetting variables lets you control state of variable. Use set to create variables or update its values, get to access them in components or queries, and unset/delete state when it’s no longer needed. These actions help keep your app logic clean.

### Set Variables

To set a variable in an application using code — for example, in a RunJS query — use the `setVariable` function. This function takes two arguments: the name of the variable and its value:

```js
actions.setVariable("<variableName>", "<variableValue>")
```

For example, if you’re building an internal tool for order management and want to store the *orderId* of a newly created order to reference it later across pages. The orderId here can stored from any component or query.
```js
actions.setVariable('currentOrderId', 'ORD-10293');
```

Simlialrly, if you want to set a page variable use the `setPageVariable` function. This function also takes two arguments: the name of the variable and its value:   
```js
actions.setPageVariable("<variableName>", "<variableValue>")
``` 

For example, if you want to set a page variable named userPreference with object with all the user preferences like `{theme:'dark', language:'en'}`, you would write:

```js
actions.setPageVariable('userPreferences', { theme: 'dark', language: 'en' });
```
### Get Variables
To access variables you can use the `getVariable` and `getPageVariable` functions. These functions take one argument: the name of the variable - 
```js

// To get app-level variable
actions.getVariable("<variableName>");

// To get page-level variable
actions.getPageVariable("<variableName>");
``` 

For example, if you previously stored an orderId and now want to use it to fetch more order details:

```js
const orderId = actions.getVariable('currentOrderId');

// You can now use `orderId` in your query or logic
```

### Unset Variables
Now, if you want to unset/delete a variable, you can use the `unsetVariable` and `unsetPageVariable` functions. These functions take one argument: the name of the variable - 
```js
// To delete app-level variable
actions.unsetVariable("<variableName>")

// To delete page-level variable
actions.unsetPageVariable("<variableName>")
```

For example, if you want to unset a page variable named userPreference, you would write:
```js
actions.unsetPageVariable('userPreferences');
```

## Use Cases

### Sharing data across pages

You can share data across different pages by setting a variable on one page and accessing it on another. 

For instance, if you are building a content management system. As you can see in the image below, there's a list of posts displayed on the homepage. When a user clicks on a view post button, they're taken to a new page where they can view the full post. The postId variable is stored globally so that it can be accessed on both pages.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/manage_var_cms.png" alt=" CMS Page"/>

On the homepage, you could add a click event handler to the view post button that sets a variable called *selectedListViewIndex* with the ID of the selected post. Then, on the second page, you could retrieve this variable and use it to fetch the full post from the database.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/manage_var_cms_inspector.png" alt="CMS variable"/>

```js
// When user clicks on a post
actions.setVariable("selectedListViewIndex", components.postList.selectedRow.id); // postId will be available on other pages too

//On the second page
const postId = actions.getVariable("selectedListViewIndex");

//You can now use the postId variable to fetch the full post from the database and display it on the second page.
```

### Setting up form payload for a multi-step form

If you’re building a multi-step form, each step may require a different set of fields. Each step is on a different page. You can use variables to construct the payload based on the currently active page.

Let’s say your form has three steps: personal details, educational background, and work experience. Each step has its own set of fields. If you want to construct a final payload to be sent as the body when the submit button is clicked on the last step, you can create a RunJS query that checks which step is active and constructs the payload accordingly. Here’s how you might implement this:

```js

let payload = {};
if (page.handle === "personalDetails") {
    payload.firstName = components.firstName.value;
    payload.lastName = components.lastName.value;
    payload.email = components.email.value;
} 
else if (page.handle === "education") {
    payload.educationLevel = components.educationLevel.value;
    payload.major = components.major.value;
    payload.graduationYear = components.graduationYear.value;
} 
else if (page.handle === "workExperience") {
    payload.companyName = components.companyName.value;
    payload.startDate = components.startDate.value;
    payload.endDate = components.endDate.value;
    payload.jobTitle = components.jobTitle.value;
}

actions.setVariable("formPayload", payload);

```

Now, you can pass this payload to a query that sends it to your backend API endpoint.

Variables help maintain data across pages, while pageVariables help managing localized, page-specific logic. Use pageVariables to handle temporary UI state within a single page, and prefer variables when data needs to persist across multiple pages. 