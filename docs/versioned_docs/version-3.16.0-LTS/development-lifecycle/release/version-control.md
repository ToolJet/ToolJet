---
id: version-control
title: Version Control
---

Version Control in ToolJet helps you to maintain multiple versions of the application, do iterative development, and deploy updates systematically. It ensures stability, and allows seamless rollout of new features or fixes.

For example, to experiment a new feature, you can create a new version of the application and try it out, without disturbing the released application. And after through testing you can release this version. This minimizes downtime, and allows developers to experiment and debug the new feature without disrupting users.

Each version is isolated from the others and can have different environments, such as development, staging, or production. Check out the **[Multi-Environment](/docs/development-lifecycle/environment/self-hosted/multi-environment)** guide for more information. Versions can also be used to rollback to a stable version if needed, checkout **[release and rollback](/docs/development-lifecycle/release/release-rollback)** guide for more information.

## Creating a Version

You can create new versions from App Version Manager in the top. It displays the current version of the app and can be used to switch between the different versions of the app. To create a new version:

1. Go to the **App Version Manager** from the toolbar and click on the dropdown. It will display all the available versions of the app. The released version name will be in green color.
    <img className="screenshot-full" src="/img/development-lifecycle/release/version-control/version-menu.png" alt="app version"/>

2. Click on **Create new version** button at the bottom of the dropdown and a modal will pop-up. 

3. Enter a **Version Name**.

4. Select the **Create version from** dropdown that will include all the versions of the app, choose a version from the dropdown that you want to use for your new version or ToolJet will automatically select the last created version.

5. Click on **Create new version** button to add a new version.
    <img className="screenshot-full img-s" src="/img/development-lifecycle/release/version-control/newpopup.png" alt="modal"/>

## Renaming a Version

To change the name of an app version, navigate to the version manager and select the version you wish to rename. From there, you can click on the rename icon located beside the version name. This will open a modal where you can modify the version name to your desired choice.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/edit.png" alt="version dropdown" />

## Deleting a Version

To remove an app version, go to the version manager and locate the version you wish to delete from the dropdown menu. Next to the version, you will find a delete icon. Click on it to delete the version. Released version cannot be deleted.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/delete.png" alt="version dropdown" />
