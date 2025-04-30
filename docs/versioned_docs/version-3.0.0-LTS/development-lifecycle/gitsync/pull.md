---
id: pull
title: Pull Changes from Git Repo
---

Once the GitSync is configured and the changes are committed to the git repository, after that the changes can be pulled from the git repository to restore the application or to use multi instance as multi environment.

## Restore Application

To restore an application from a git repository, click on the kebab menu (three dots) on the right side of the **Create new app** button on the dashboard. Click on the **Import from git repository** option.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/gitsync/restore-app.png" alt="GitSync" />

When you click on the **Import from Git repository** option, a modal will appear with a dropdown to select the app you want to import from the Git repository.

After selecting an app, you can:
- Edit the application name. The app imported from the Git repository should have a unique name. If the app's name is the same as that of an existing app in the workspace, the user will need to either rename the existing app or delete it to successfully import another app with the same name.
- Enable the **Make application editable** checkbox if you want to modify the app after import. If you leave this checkbox unchecked, you will still have the option to enable editing later when you open the application in the App Builder.

Once everything is configured, click the **Import app** button to complete the import process.

The workspace constants are not synced with the Git repository. After pulling the app, if it throws an error, you may need to manually add the required workspace constants.


<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/gitsync/pull/pull-1.png" alt="GitSync" />



## Pull Changes

If other developers in your company have made updates to an app, you can pull the latest commit to get those changes.

To check for updates and pull changes from the Git repository, follow these steps:

1. Click on the **GitSync** button, a modal will open and under the pull tab there will be an option to **Check for updates**. 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/gitsync/pull/pull-2.png" alt="GitSync" />

2. Click on the **Check for updates** button to check for updates in the git repository. If there are any updates, you will see the details of the updates such as commit message, author, and the date in the modal. 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-s" src="/img/gitsync/pull/pull-3.png" alt="GitSync" />

3. Click on the **Pull changes** button to pull the changes from the git repository.




