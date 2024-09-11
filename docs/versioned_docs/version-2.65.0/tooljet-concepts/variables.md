---
id: variables
title: Variables 
---

Variables can be used to store data that can be accessed and manipulated inside your application or across a workspace. You can create and access a variety of variables in ToolJet:

- **Variables** that can be defined and accessed anywhere within an application 
- **Page Variables** that can be defined and accessed on a particular page of the application
- **Exposed Variables** that hold important values related to a component and are accessible within an application
- **Workspace Variables** that are available across all applications in a workspace
- **Environment Variables** for environment-specific settings, streamlining app development and configuration

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Variables and Page Variables
You can use the `setVariable(key, value)` function to define a variable in a `Run Javascript code` query while a page variable can be defined using the `setPageVariable(key, value)`. Once defined these variables can be used to define the functionality of an application. For instance, you can use the `setVariable(key, value)` function to create a variable to keep a history of pages visited by the user within the application. This can be used for implementing custom back navigation or analytics on user flow and engagement within the app. Similarly, you can create and utilize a page variable to remember a user's filter selections (e.g., date range) on a reporting page.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/variables/variables-demo.png" alt="Preview Of Variables" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exposed Variables
**Exposed Variables** are used to access and manipulate data related to the components. These variables are automatically created and updated as users interact with the application. Whether it's capturing text from a text editor checking the visibility of a component, or retrieving selections from a dropdown menu, exposed variables are integral for dynamic data handling in ToolJet applications.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Workspace Variables 
**Workspace variables** are designed to store values like tokens, secret keys, or API keys that applications across the same workspace may require. This facilitates secure and centralized management of sensitive information, ensuring that critical data is easily accessible to all relevant tools within the workspace without compromising security.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Environment Variables
**Environment variables** are often used to manage configuration settings that differ between deployment environments (e.g., development, testing, production). They can store database connection strings, external API URLs, or any other environment-specific information, enabling developers to tailor application behavior without altering the codebase.

</div>

Together, these variable management functions and types provide a robust framework for organizing, sharing, and securing data across complex internal tool ecosystems, ensuring both flexibility and integrity in application development and deployment.

To learn more about different types of variables and their usage, go through the below links:

**[Setting and unsetting variables and page variables](/docs/how-to/run-actions-from-runjs)** <br/>
**[Exposed variables](/docs/tooljet-concepts/exposed-variables)** <br/>
**[Environment variables](/docs/setup/env-vars/)** <br/>
**[Workspace variables](/docs/org-management/workspaces/workspace-variables/)**