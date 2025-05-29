---
id: variables
title: Set Variables Using Events
---

Variables let you store and manage data either across your entire application or within specific pages. You can use them to manage component state, control logic, store user input or to create personalized user experiences. By setting a value once in a variable, you can reuse it across different parts of your app. This makes your app easier to build and maintain, without needing to store everything in a database.

ToolJet supports two types of variables:

- **App-level variables** are available across all pages in your app. To set an app-level variable, use the `setVariable` action.
- **Page-level variables** are only available on the page where they are created. To set a page-level variable, use the `setPageVariable` action.

## Set Variables

### App Level Variable

Suppose you are building a multi-page app where, on the first page, you ask the user for their name and want to use it throughout the entire app. Here’s how to do it:
1. Add a **Text Input** component to collect the user’s name.
2. Add a **Button** component to submit the name.
3. Set up this event handler on the button:
    - Event: **On Click**
    - Action: **Set variable**
    - Key: `username`
    - Value: `{{components.usernameinput.value}}` 

When the user clicks the button, their name will be stored in the app-level variable `username`. You can access this variable anywhere in your app with this syntax:

```js
{{variables.username}}
```

### Page Level Variable

Now, suppose you have a form in your application and want to store the user’s contact number only on that page when they submit the form. To do this, set this event handler on the submit button:

- Event: **On Click**
- Action: **Set page variable**
- Key: `contact`
- Value: `{{components.feedbackForm.data.contact.value}}` 

When the user clicks submit, their contact number will be saved in a page-level variable named `contact`. This variable can only be used on that specific page with this syntax:

```js
{{page.variables.contact}}
```

## Unset Variables

### App Level Variables

In your multi-page app, you may want to clear (unset) the `username` variable when the user clicks the **Finish** button on the last page. To do this, set the following event handler on the Finish button:

- Event: **On Click**
- Action: **Unset variable**
- Key: `username`

### Page Level Variables

In your form app, you might want to clear the page-level `contact` variable when the user clicks the **Next Page** button. To do this, set this event handler on the Next Page button:

- Event: **On Click**
- Action: **Unset page variable**
- Key: `contact`

