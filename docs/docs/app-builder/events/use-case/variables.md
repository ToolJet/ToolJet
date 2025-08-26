---
id: variables
title: Setting Variables
---

Variables let you store and manage data across your entire application. You can use them to manage component state, control logic, store user input or to create a personalized user experiences. By setting a value once in a variable, you can reuse it across different parts of your app. This makes your app easier to build and maintain, without needing to store everything in a database.

ToolJet supports two types of variables:

- **App-level variables** are available across all pages in your app. To set an app-level variable, use the `setVariable` action.
- **Page-level variables** are only available on the page where they are created. To set a page-level variable, use the `setPageVariable` action.

## Set Variables

### App Level Variable

Suppose you are building a multi-page application where, on the first page, you ask the user for their name and want to use it in the other pages. Here’s how to do it:
1. Add a **Text Input** component to collect the user’s name.
2. Add a **Button** component to submit the name.
3. Set up this event handler on the **Button** component:
    - Event: **On Click**
    - Action: **Set variable**
    - Key: `username` *(Variable name of your choice.)*
    - Value: `{{components.usernameinput.value}}` *(Refer to the user input in the **Text Input** component.)*

<img className="screenshot-full img-full" src="/img/app-builder/events/variables/username.png" alt="Events Architecture Diagram"/> <br/><br/>

When the user clicks the **Button** component, their name will be stored in the app-level variable `username`. You can access this variable anywhere in your app with this syntax:

```js
{{variables.username}}
```

### Page Level Variable

Now, suppose you have a **Form** in your application and want to store the user’s contact number only on that page when they submit the **Form**. To do this, set this event handler on the **Button** component:

- Event: **On Click**
- Action: **Set page variable**
- Key: `contact` *(Variable name of your choice.)*
- Value: `{{components.feedbackForm.data.contact.value}}`  *(Refer to the user input in the **Number Input** component.)*

When the user clicks on the **Button** component, their contact number will be saved in a page-level variable named `contact`. This variable can only be used on that specific page with this syntax:

```js
{{page.variables.contact}}
```

## Unset Variables

### App Level Variables

In your multi-page app, you may want to clear (unset) the `username` variable when the user clicks the **Button** component named "Finish" on the last page. To do this, set the following event handler on the **Button** component:

- Event: **On Click**
- Action: **Unset variable**
- Key: `username` *(Variable name you want to unset.)*

### Page Level Variables

In your **Form** app, you might want to clear the page-level `contact` variable when the user clicks the **Button** component named "Next Page". To do this, set this event handler on the **Button** component:

- Event: **On Click**
- Action: **Unset page variable**
- Key: `contact` *(Variable name you want to unset.)*

:::info
You can also manage variables using code. Refer to the [Manage Variables](/docs/app-builder/custom-code/managing-variables) guide for more information.
:::