---
id: versioning-and-release
title: Versioning and Release
---

Versioning and Release allows you to manage version control for your applications, enabling structured updates and seamless rollouts of changes to users. With support for multiple environments, you can test updates in staging or development environments before deploying them to production or releasing the app.

## Versioning

Versioning is used to track changes and maintain a history of application updates and deploy them systematically. It ensures stability, facilitates collaboration, and enables seamless rollouts of new features or fixes to users. Versioning is really useful if multiple developers are working on an app, it allows them to save their own version of the app. This also prevents developers from overwriting the other developer's work. 

### Creating a Version

You can create new versions from **App Version Manager** on the top-right corner. It displays the version of the app that you're currently working and can be used to switch between the different version of the app. To create a new version:

- Go to the **App Version Manager** from the toolbar and click on the dropdown. It will display all the versions of the app that have been created. The released version name will be in green color.
<img className="screenshot-full" src="/img/tutorial/versioning-and-release/version-menu.png" alt="app version"/>

- Click on **Create new version** button present at the bottom of the dropdown and a modal will pop-up. Enter a **Version Name** and click on **Create version from** dropdown that will include all the versions of the app, choose a version from the dropdown that you want to use for your new version or ToolJet will automatically select the last created version, and then click on **Create new version** button to add a new version.
<img className="screenshot-full" src="/img/tutorial/versioning-and-release/newpopup-v2.png" alt="modal"/>

### Renaming a Version

If you want to change the name of an app version, navigate to the **version manager** and select the version you wish to rename. From there, you can click on the rename button located beside the version name. This will open a modal where you can modify the version name to your desired choice.

<img className="screenshot-full" src="/img/tutorial/versioning-and-release/edit-v2.png" alt="version dropdown" />

### Deleting a Version

If you want to remove an app version, go to the **version manager** and locate the version you wish to delete from the dropdown menu. Next to the version, you will find a delete icon. Click on it to delete the version.

<img className="screenshot-full" src="/img/tutorial/versioning-and-release/delete-v2.png" alt="version dropdown" />

## Environments

ToolJet supports multiple environments, such as Development, Staging, and Production, to facilitate smooth workflows. These environments enable teams to test and validate changes thoroughly before deploying them to end users.

To promote any environment, click on the **Promote** button located at the top right corner.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/tutorial/versioning-and-release/promote-button.png" alt="version dropdown" />

:::caution
You cannot edit a version that has been promoted to a staging or production environment or released. It is always safe to create a copy by creating a new version before promoting it.
:::

## Release

Making a release let's you publish the app and to release a app, first you will have to promote it till the production environment and then click on the **Release** button on the top-right corner.
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/tutorial/versioning-and-release/release-v3.png" alt="release"/>

A confirmation dialog will popup that prompts you to decide whether to release the current version of the app. Clicking on the **Release** button will release the current version of the app.<img style={{ marginTop:'15px' }} className="screenshot-full" src="/img/tutorial/versioning-and-release/confirm-v2.png" alt="release"/>

:::caution
- When an app is made **Public** without being released, it functions similarly to previewing the application. This means that the version that is loaded when accessing the app through its Public app URL will be the same version of the app currently loaded in the app builder.

- To prevent the unintended publishing of an unfinished app, ToolJet will prompt you to create a new version for making any edits to the Released version of an app. Editing of the Released version will be blocked until a new version is created.

<img className="screenshot-full" src="/img/tutorial/versioning-and-release/releasepopup.gif" alt="release" />

:::
