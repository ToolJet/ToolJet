---
id: topbar
title: Topbar
---

Topbar is present at the top of the app-builder, and is used to configure the app settings.

### App name

The App name can be modified by selecting the application name located on the left side of the topbar.

Upon the creation of a new app, it is automatically assigned a unique app name.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/appnamenew-v2.png" alt="App Builder: Topbar"/>

</div>

### Desktop or Mobile layout

Switch the canvas mode in Mobile or Desktop layout from the topbar.

#### Showing component on mobile layout

Click on the component handle to open [component config inspector](/docs/app-builder/components-library#component-config-inspector) on the right sidebar. Scroll down to the **Layout** section and toggle on the Mobile Layout option. The width of the components will be adjusted to fit the Mobile Layout.

#### Adding a new component to mobile layout

Switch the canvas to mobile layout by clicking the mobile icon on the topbar. Drag and drop a new component to the canvas. This component will not be visible on the desktop layout unless **Show on desktop** is enabled from the component config inspector.

:::info
Width of the component will be automatically adjusted to fit the screen while viewing the application in app viewer.
:::

### Changes saved indicator

Whenever a change is made on the component or the query panel/queries, the changes are saved automatically. The changes saved indicator will be displayed on the topbar. This helps the developer to know if the changes are saved or not.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/changessaved-v2.png" alt="App Builder: Topbar"/>

</div>

### Developer Details

This will show a profile picture of the developer who is currently working on the application. Hovering over the profile picture will show the name of the developer. If there is no profile picture, then the first letter of the first name and last name will be displayed.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/profile-v2.png" alt="App Builder: Topbar"/>

</div>

### Version Manager

**Add** or **remove** versions of an application from the Version Manager. Click on the `edit` icon next to version name to rename the version.

When many developers are working on an app, **Versioning** allows them to save their own version of the app. This also prevents developers from overwriting the other developer's work.

:::tip
Versioning is also helpful when working with **[multiple environments](/docs/release-management/multi-environment/)** like development, staging and production.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/versionsnew-v2.png" alt="App Builder: Topbar"/>

</div>

### Undo or Redo

Undo or Redo any action performed on the canvas.

You can also use **[Keyboard Shortcuts](/docs/tutorial/keyboard-shortcuts)** to perform such actions.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/undo-v3.png" alt="App Builder: Topbar"/>

</div>

### Share

Share your applications with a unique URL generated automatically or edit the URL slug to personalize it.

- When **Make application public** toggle is off and **Shareable app link** is shared then the users will have to login to ToolJet to use the application. Toggle on to make the application public and accessible to anyone on the internet without requiring a ToolJet login. Only released apps can be accessed using the **Shareable app link**. 
- ToolJet generates the **Embedded link** which can be used to embed application on the webpages.

:::tip
Learn more about **[Sharing](/docs/app-builder/share)** your tooljet applications.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/sharenew-v2.png" alt="App Builder: Topbar"/>

</div>

### Preview

Clicking on **Preview** button will open up the currently opened version of the app in the new tab. This is really handy when the app developer wants to immediately check the app preview in production.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/previewnew-v2.png" alt="App Builder: Topbar"/>

</div>

### Release

Release the app to publish the current version of the app and push the changes into the production.

:::caution
ToolJet will block editing of the Released version of an app and will display a prompt to create a new version to make the changes. This is to prevent accidentally pushing an unfinished app to the live version.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/releasenew-v2.png" alt="App Builder: Topbar"/>

</div>