---
id: use-inspector
title: Use Inspector in App-Builder
---

This guide introduces **Inspector** in the app-builder, a feature that lets you view data related to queries, components, global variables, page-related variables, user-set variables and constants.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/how-to/use-inspector/use-inspector-preview.png" alt="Preview of Use Inspector" width="100%" />
</div>

## Sections

The Inspector panel has 6 main sections:

- **[Queries](#queries)**
- **[Components](#components)**
- **[Globals](#globals)**
- **[Variables](#variables)**
- **[Page](#page)**
- **[Constants](#constants)**


### Queries

Queries allow you to inspect the specifics of your queries. However, the data related to these queries will only be visible after they have been executed or triggered.


### Components

Under Components, you can view and analyze the properties and values of the components you've added to the canvas, providing insights into how each component functions within your app.

### Globals

Globals give you access to global information related to the app. 

The globals selection consists of the following data:

- **currentUser:** Contains details about the user who is currently logged in, like their **email**, **firstName**, and **lastName**.
- **groups:** A list of group names that the logged-in user is part of. Note: The `all_users` group is a default group for everyone.
- **theme:** Shows the name of the theme that is currently being used.
- **urlparams:** Details about the URL parameters of the app.
- **environment:** Has two parts: **id**, a unique auto-generated identifier, and **name**, the name of the current environment of the app version.
- **modes:** Indicates whether the app is in **edit**, **preview**, or **view** mode. **Edit** is for editing the app, **preview** is used when the preview button in the app builder is clicked, and **view** is for when the app is opened through a shared URL.

:::info
All the global variables can be accessed anywhere within ToolJet applications. Here's an **[example use-case](/docs/how-to/access-currentuser)** that demonstrates the usage of these variables.
:::

### Variables

Variables shows user-defined variables in a key-value format. These variables, set through event handlers or queries, are accessible across the entire application. You can set variables from the [event handler](/docs/actions/set-variable) or using [JavaScript code](/docs/how-to/run-actions-from-runjs#set-variable).

### Page
Page lets you view page-specific properties like page name, handle and variables. Page variables are restricted to their respective pages and are not accessible application-wide.

### Constants

Under **[Constants](/docs/org-management/workspaces/workspace_constants/)**, you can find the predefined values (usually tokens/secret keys/API keys) that can be used across your application to maintain consistency and facilitate easy updates. 

:::info
The **environment** and **mode** variables are only available in **ToolJet Enterprise Edition v2.2.3** and above.
:::
