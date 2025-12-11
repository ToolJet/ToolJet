---
id: version-control
title: Version Control
---

Version Control in ToolJet helps you to maintain multiple versions of the application, do iterative development, and deploy updates systematically. It ensures stability, and allows seamless rollout of new features or fixes.

For example, to experiment a new feature, you can create a new draft version of the application and try it out, without disturbing the released application. And after through testing, you can release this version. This minimizes downtime, and allows developers to experiment and debug the new feature without disrupting users.

Each version is isolated from the others and can have different environments, such as development, staging, or production. Check out the **[Multi-Environment](/docs/development-lifecycle/environment/self-hosted/multi-environment)** guide for more information. Versions can also be used to rollback to a saved version if needed, checkout **[release and rollback](/docs/development-lifecycle/release/release-rollback)** guide for more information.

## Creating a Draft Version

You can create new versions from the **Version Manager** at the top. It displays the current version of the app and can be used to switch between different versions of the app. To create a new version:

1. Go to the **Version Manager** from the toolbar and click on the dropdown. It will display all the available versions of the app. The released version will have a green coloured tag saying **Released** beside it. The draft versions will have a tag saying **Draft** beside them.
    <img className="screenshot-full" src="/img/development-lifecycle/release/version-control/draft-version/version-menu.png" alt="app version"/>

2. Click on **Create draft version** button at the bottom of the menu and a modal will pop-up. 

3. Enter a **Version Name**.

4. Select the **Create from version** dropdown that will include all the saved versions of the app, choose a version from the dropdown that you want to use for your new version or ToolJet will automatically select the last released version.

5. Click on **Create version** button to add a new version.
    <img className="screenshot-full img-s" src="/img/development-lifecycle/release/version-control/draft-version/newpopup.png" alt="modal"/>

### How draft versions work

A draft version represents the working copy of your application. Whenever you begin making changes, ToolJet ensures that the edits take place inside a draft. Drafts allow you to experiment safely without affecting the active version in an environment.

A draft can be saved as a version when you are ready to promote or release your changes. Only saved versions can be promoted to staging or production, while draft versions remain editable. This helps maintain a clear separation between in-progress work and versions that are ready for deployment or testing.

## Renaming a Version

To change the name of an app version, navigate to the **version manager** and locate the version you wish to rename. From there, you can click on the `⋮` icon located beside the version name. Then, click on **Edit details**. A modal will popup. You can change the **Version name** and **Version description** in the modal. Released versions cannot be edited.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/draft-version/edit.png" alt="version dropdown" />

## Deleting a Version

To remove an app version, navigate to the version manager and select the version you wish to delete. From there, you can click on the `⋮` icon located beside the version name. Then, click on **Delete version** to delete the version. Released version cannot be deleted.

<img className="screenshot-full img-l" src="/img/development-lifecycle/release/version-control/draft-version/delete.png" alt="version dropdown" />

