---
id: pull
title: Pull Changes from Git Repo
---

Once the GitSync is configured and the changes are committed to the git repository, after that the changes can be pulled from the git repository to restore the application or to use multi instance as multi environment.

## Restore Application

To restore an application from a git repository, click on the kebab menu (three dots) on the right side of the **Create new app** button on the dashboard. Click on the **Import from git repository** option.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/restore-app.png" alt="GitSync" />

On clicking the **Import from git repository** option, a modal will open with the dropdown to select the app to be imported from the git repository. Once the app is selected, the app name and the last commit will be displayed. Click on the **Import app** button to import the app from the git repository. 

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/importmodal-v3.png" alt="GitSync" />

**Note**:
- The app imported from the git repository cannot be edited. To edit the application, you will need to clone it.
- The app imported from the Git repository should have a unique name. If the app's name is the same as that of an existing app in the workspace, the user will need to either rename the existing app or delete it to successfully import another app with the same name.
- Workspace constants are not synced with the git repository. After pulling the app, if the app throws an error, the user will need to manually add the workspace constants.

## Pull Changes

You can check for updates and pull changes from the git repository by following these steps:

1. Click on the **GitSync** button, a modal will open with the option to **Check for updates**. 

2. Click on the **Check for updates** button to check for updates in the git repository. If there are any updates, you will see the details of the updates such as commit message, author, and the date in the modal. 

3. Click on the **Pull changes** button to pull the changes from the git repository.

    <img className="screenshot-full" src="/img/gitsync/updatecheck-v2.png" alt="GitSync" />

