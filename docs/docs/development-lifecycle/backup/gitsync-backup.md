---
id: gitsync-backup
title: Pulling Changes from Git Repo
---

You can configure the GitSync feature on another workspace to pull the changes from the git repository. To configure the GitSync feature on another workspace, follow the steps mentioned in the [Setting up GitSync](#setting-up-gitsync) section.

Once the GitSync feature is configured, go to the ToolJet dashboard and click on the three dots on the right side of the **Create new app** button. Click on the **Import from git repository** option.

<img className="screenshot-full" src="/img/gitsync/importgit-v2.png" alt="GitSync" />

On clicking the **Import from git repository** option, a modal will open with the dropdown to select the app to be imported from the git repository. Once the app is selected, the app name and the last commit will be displayed. Click on the **Import app** button to import the app from the git repository. 

:::caution
- The app imported from the git repository cannot be edited.
- The app imported from the Git repository should have a unique name. If the app's name is the same as that of an existing app in the workspace, the user will need to either rename the existing app or delete it to successfully import another app with the same name.
- Workspace constants are not synced with the git repository. After pulling the app, if the app throws an error, the user will need to manually add the workspace constants.
:::

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/gitsync/importmodal-v2.png" alt="GitSync" />

### Checking for Updates

You can check for updates in the git repository by clicking on the **GitSync** button on the topbar. On clicking the **GitSync** button, a modal will open with the option to **Check for updates**. Click on the **Check for updates** button to check for updates in the git repository. If there are any updates, you will see the details of the updates such as commit message, author, and the date in the modal. Click on the **Pull changes** button to pull the changes from the git repository.

<img className="screenshot-full" src="/img/gitsync/updatecheck.png" alt="GitSync" />
