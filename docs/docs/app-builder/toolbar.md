---
id: topbar
title: Topbar
---

The Topbar of the app-builder interface serves as a central hub for configuring app settings.

### Application Name

To modify the app name, click on the application name on the left side of the topbar.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/appnamenew-v2.png" alt="App Builder: App Name"/>
</div>

### Desktop or Mobile layout

Toggle between Mobile and Desktop views directly from the topbar to switch the canvas mode.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/mobiledesktopswitch.png" alt="App Builder: Mobile and Desktop Mode"/>
</div>

#### Showing Components on Mobile or Desktop layout

Select a component and navigate to its Properties Panel on the right. Scroll down to the **Devices** section and toggle on the `Show on mobile` option. This will ensure that the component is visible in Mobile view.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/showonmobile.png" alt="App Builder: Show On Mobile Icon"/>
</div>

Similarly, you can toggle on the `Show on desktop` option to make the component visible in the Desktop view.

### Changes Saved Indicator

Whenever changes are made in the application, they are saved automatically. The topbar's `Changes Saved` indicator shows the save status.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/changessaved-v2.png" alt="App Builder: Changes Saved Indicator"/>
</div>

### Developer Details

The Developer Details icon will show a profile picture of the currently active developer. Hovering over this picture reveals the developer's name. If no picture is set, initials are displayed.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/profile-v2.png" alt="App Builder: Developer Details"/>
</div>

### App Environment

You can use the Env dropdown menu to select an environment for your app: Development, Staging, or Production. This feature facilitates seamless transition through the app development cycle.

:::tip
Learn more about multi-environment configuration **[here](/docs/release-management/multi-environment/)**.
:::

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/multienv.png" alt="App Builder: App Env"/>
</div>

### Version Manager

You can manage application versions through the Version Manager. You can use this dropdown to edit a version name or adding/removing versions.

:::tip
Versioning is also helpful when working with **[multiple environments](/docs/release-management/multi-environment/)** like development, staging and production.
:::

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/versionsnew-v2.png" alt="App Builder: Version Manager"/>
</div>


### Gitsync
The `Gitsync` icon next to the versions dropdown allows you to sync your application with your GitHub repository.

Read more about Gitsync **[here](/docs/gitsync.md)**. 
### Undo or Redo

You can Undo or Redo any action performed on the canvas using the Undo and Redo buttons. 

You can also use **[Keyboard Shortcuts](/docs/tutorial/keyboard-shortcuts)** to perform such actions.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/undo-v3.png" alt="App Builder: Topbar"/>
</div>

### Share

The Share button allows you to share your applications with a unique URL generated automatically or edit the URL slug to personalize it. The share button will only be active when your application is released. 

:::tip
Learn more about **[Sharing](/docs/app-builder/share)** your ToolJet applications.
:::

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/sharenew-v2.png" alt="App Builder: Share"/>
</div>

### Preview

The Preview button allows you to view the current app version in a new tab, facilitating immediate feedback on changes.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/previewnew-v2.png" alt="App Builder: Preview"/>
</div>

### Release

Use the Release button on the right to publish the current app version. The Release button, used to publish the current app version, becomes visible only in the Production environment, ensuring that only finalized versions are made public.

:::caution
ToolJet will block editing of the Released version of an app and will display a prompt to create a new version to make the changes. This is to prevent accidentally pushing an unfinished app to the live version.
:::

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/toolbar/releasenew-v2.png" alt="App Builder: Topbar"/>
</div>