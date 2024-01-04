---
id: topbar
title: Topbar
---

Topbar is present at the top of the app-builder, and is used to configure the app settings.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/toolbar.png" alt="App Builder: Topbar"/>

</div>

### App name

App name can be edited from the left side of the topbar next to the ToolJet logo.

When a new app is created, by default its name is set to **Untitled app**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/name.png" alt="App Builder: Topbar"/>

</div>

### Global Settings

To configure the app's global settings, click on the kebab menu(three vertical dots) on the left of the app name. Global settings include:

- **Hide header for launched apps**: Toggle this on to the hide the tooljet's header when the applications are launched
- **Maintenance mode**: Toggle this on to put the application in maintenance mode. When in **maintenance mode**, on launching the app, the user will get an error message that **the app is under maintenance**.
- **Max width of canvas**: Modify the width of the canvas in **px** or **%**. The default width is 1292 px.
- **Max height of canvas**: Modify the width of the canvas in **px** or **%**. The default height is 2400 px and currently it is the maximum height limit.
- **Background color of canvas**: Enter the hex color code or choose a color from the picker to change the background color of the canvas. You can also click on the **Fx** to programmatically set the value.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/globalset.png" alt="App Builder: Topbar"/>

</div>

### Desktop or Mobile layout

Switch the canvas mode in Mobile or Desktop layout from the topbar.

#### Adding existing component to mobile layout

Click on the component handle to open component config inspector on the right side. Scroll down to the **Layout** section and enable Mobile Layout. The width of the widget will be adjusted to fit the Mobile Layout.

#### Adding a new component to mobile layout

Switch the layout to mobile by clicking the button on the topbar. Drag and drop a component to the canvas. This widget will not be shown on desktop layout unless **Show on desktop** is enabled from the component config inspector.

:::info
Width of the component will be automatically adjusted to fit the screen while viewing the application in app viewer.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/view.png" alt="App Builder: Topbar"/>

</div>

### Undo or Redo

Use the undo or redo buttons from the topbar to undo or redo any change on the canvas.

You can also **[Keyboard Shortcuts](/docs/tutorial/keyboard-shortcuts)** to perform such actions.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/undo.png" alt="App Builder: Topbar"/>

</div>

### Version Manager

Create or Remove Versions of the applications from the Version Manager. You can also edit the version name from the edit button.

When many developers are working on an app, **Versioning** allows them to save their own version of the app. This also prevents developers from overwriting the other developer's work.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/version.png" alt="App Builder: Topbar"/>

</div>

### Comments

Comment anywhere on the canvas and collaborate with other users in the workspace. Click on the comments button to enable it and then drop comment anywhere on the canvas.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/comments.png" alt="App Builder: Topbar"/>

</div>

### Share

Share your applications with a unique URL generated automatically or edit the URL slug to personalize it.

- When **Make the application public** is off and URL is shared then the users will have to login to ToolJet to use the application. Toggle on the option then anyone on the internet will be able to access the application without logging in to ToolJet.
- ToolJet generates the **Embedded link** which can be used to embed application on the webpages.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/share.png" alt="App Builder: Topbar"/>

</div>

### Preview

Clicking on **Preview** button will open up the currently opened version of the app in the new tab. This is really handy when the app developer wants to immediately check the app preview in production.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/preview.png" alt="App Builder: Topbar"/>

</div>

### Release

Release the app to publish the current version of the app and push the changes into the production.

:::caution
ToolJet will block editing of the Released version of an app and will display a prompt to create a new version to make the changes. This is to prevent accidentally pushing an unfinished app to the live version.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/release.png" alt="App Builder: Topbar"/>

</div>