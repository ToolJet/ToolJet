---
id: version-control
title: Version Control
---

Versioning and Release allows you to manage version control for your applications, enabling structured updates and seamless rollouts of changes to users. With support for multiple environments, you can test updates in staging or development environments before deploying them to production or releasing the app.

Versioning is used to track changes and maintain a history of application updates and deploy them systematically. It ensures stability, facilitates collaboration, and enables seamless rollouts of new features or fixes to users. Versioning is useful when multiple developers are working on an app, it allows them to save their own version of the app. This also prevents developers from overwriting the other developer's work. 

## Creating a Version

You can create new versions from App Version Manager in the top. It displays the current version of the app and can be used to switch between the different versions of the app. 

To create a new version:

- Go to the **App Version Manager** from the toolbar and click on the dropdown. It will display all the versions of the app that have been created. The released version name will be in green color.
<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/development-lifecycle/release/version-control/version-menu.png" alt="app version"/>

- Click on **Create new version** button at the bottom of the dropdown and a modal will pop-up. Enter a **Version Name** and click on **Create version from** dropdown that will include all the versions of the app, choose a version from the dropdown that you want to use for your new version or ToolJet will automatically select the last created version, and then click on **Create new version** button to add a new version.

<img className="screenshot-full" src="/img/development-lifecycle/release/version-control/newpopup-v2.png" alt="modal"/>

## Renaming a Version

To change the name of an app version, navigate to the version manager and select the version you wish to rename. From there, you can click on the rename button located beside the version name. This will open a modal where you can modify the version name to your desired choice.

<img className="screenshot-full" src="/img/development-lifecycle/release/version-control/edit-v2.png" alt="version dropdown" />

## Deleting a Version

To remove an app version, go to the version manager and locate the version you wish to delete from the dropdown menu. Next to the version, you will find a delete icon. Click on it to delete the version.

<img className="screenshot-full" src="/img/development-lifecycle/release/version-control/delete-v2.png" alt="version dropdown" />
