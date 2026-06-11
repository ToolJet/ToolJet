---
id: left-sidebar
title: Left-sidebar
---

Left-sidebar has the following options:

- **[Pages](#pages)**
- **[Inspector](#inspector)**
- **[Debugger](#debugger)**
- **[Global Settings](#global-settings)**
- **[Comments](#comments)**
- **[Theme switch](#theme-switch)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/leftsidebar/leftnew.png" alt="App Builder: Left-sidebar"/>

</div>

## Pages

Pages allows you to have multiple pages in a single application, making your ToolJet applications more robust and user-friendly.

Check the detailed documentation for **[Pages](/docs/tutorial/pages)**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/leftsidebar/pagesnew.png" alt="App Builder: Left-sidebar"/>

</div>

## Inspector

The Inspector can be used to inspect the data of the **queries**, properties and values of the **components** that are there on the canvas, ToolJet's global variables and the variables that have been set by the user.

Check the detailed guide on **[using Inspector](/docs/how-to/use-inspector)**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/leftsidebar/inspectornew.png" alt="App Builder: Left-sidebar"/>

</div>

## Debugger

Debugger records any errors that occur during the execution of queries. For instance, if a database query fails because the database is unavailable or if a REST API query fails due to an incorrect URL, the errors will be captured and shown in the debugger. Additionally, the debugger provides pertinent information associated with the error alongside the error message.

If you wish to prevent the debugger from closing, you can simply click on the pin icon located in the top-right corner. By doing so, the debugger will stay open until you decide to unpin it.

Debugger consists of two main sections:

1. **All Log:** In this section, you can view a comprehensive list of all the logs generated during the execution of the application. These logs may include various types of messages, such as success messages, warning, and error messages.

2. **Errors:** This section specifically focuses on displaying the error messages that occurred during the program's execution. These error messages indicate issues or problems that need attention, as they may lead to unexpected behaviors of the application. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/leftsidebar/newdebugger.gif" alt="App Builder: Left-sidebar"/>

</div>

## Global Settings

To configure the app's global settings, click on the kebab menu(three vertical dots) on the left of the app name. Global settings include:

- **Unique app slug**: The unique slug of the application. This slug is used in the URL of the application. By default, the slug is the `app id` of the application. You can change the slug to a custom value. For example, if the slug is `7b56293b-be5a-401f-8806-b71625f8ee0d` you can change it to `<unique-name>` then the new URL of the application will be `https://app.tooljet.com/<workspace-name>/apps/<unique-name>/`
- **App link**: The link to the application. This link can be used to share the application with other users of the workspace. If you want to share the application with users outside the workspace, you can make the application public from the **[Share](/docs/app-builder/share)** modal.
- **Hide header for launched apps**: Toggle this on to the hide the tooljet's header when the applications are launched
- **Maintenance mode**: Toggle this on to put the application in maintenance mode. When in **maintenance mode**, on launching the app, the user will get an error message that **the app is under maintenance**.
- **Max width of canvas**: Modify the width of the canvas in **px** or **%**. The default width is `1292` px.
- **Background color of canvas**: Enter the hex color code or choose a color from the picker to change the background color of the canvas. You can also click on the **Fx** to programmatically set the value.
- **Export app**: Click on the [Export app](/docs/dashboard/#export-app) button to export the application as a JSON file. You can import this JSON file in any other workspace to use the application.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/leftsidebar/globalsettings.png" alt="App Builder: Left-sidebar"/>

</div>

## Comments

Comment anywhere on the canvas and collaborate with other users in the workspace. Click on the comments button to enable it and then drop comment anywhere on the canvas.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/leftsidebar/commentnew.png" alt="App Builder: Left-sidebar"/>

</div>

## Theme Switch

Use the theme switch button to toggle ToolJet between light and dark modes.

While developers can access the current theme's value through global variables using `{{globals.theme.name}}`, it is not currently feasible to change the theme programmatically.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/leftsidebar/theme.png" alt="App Builder: Left-sidebar"/>

</div>