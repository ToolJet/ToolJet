---
id: gitsync
title: GitSync
---

GitSync feature allows users to synchronize the applications on their workspace with a git repository. GitSync feature simplifies the process of managing and version controlling your applications on ToolJet.

## Overview

ToolJet applications can be synchronized with a Git repository, offering the flexibility to tailor your application development and deployment processes across various environments while aligning with best practices for the application development lifecycle.

## Setting up GitSyncing with GitHub

:::caution
- ToolJet support git repo managers like GitHub, GitLab, Bitbucket, AWS CodeCommit, and Azure Repos.
- Only Admins have the permission to configure the GitSync feature on workspace level.
:::

### Step 1: Create a new repository on GitHub

Create a new repository on GitHub. The repository can be public or private. You can also use an existing repository. Make sure that the repository is empty.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/github1.png" alt="GitHub" />

</div>

### Step 2: Obtain the repository URL

Obtain the **SSH URL** of the repository. When a repository is created, GitHub shows a screen with the repository URL. If the repository is already created, you can obtain the URL by clicking on the **Clone or download** button.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/github2.png" alt="GitHub" />

</div>

### Step 3: Configure the GitSync feature on ToolJet

Go to the **Workspace settings**, and click on the **Configure git** tab.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/gitsync.png" alt="GitSync" />

</div>
<br/>

Enter the **SSH URL** of the repository (obtained in Step 2) in the **Git Repository URL** field. Click on the **Generate SSH Key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/git2.png" alt="GitSync" />

</div>

### Step 4: Deploy the SSH key to GitHub repository

Go to the **Settings** tab of the GitHub repository that you created in Step 1, and click on the **Deploy keys** tab. Click on the **Add deploy key** button. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/github3.png" alt="GitHub" />

</div>

Enter a title for the SSH key in the **Title** field. Paste the SSH key that you copied in Step 3 in the **Key** field. Make sure that the **Allow write access** checkbox is checked, especially when configuring the GitSync feature to [push changes to Git](#pushing-changes-to-git-repo). However, it is not mandatory to check this option when setting up the GitSync feature for [pulling changes from Git](#pulling-changes-from-git-repo). Finally, click on the **Add key** button.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/github4.png" alt="GitHub" />

</div>

### Step 5: Finish the GitSync configuration on ToolJet

Go back to the **Configure git** tab on ToolJet, and click on the **Finalize setup** button. If the SSH key is configured correctly, you will see a success message.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/git5.png" alt="GitSync" />

</div>

## Enable/Disable GitSync

To enable or disable the GitSync feature, go to the **Configure git** tab on the **Workspace settings** page, and toggle on/off the **Connect** switch. This is only available if the GitSync feature is configured.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/connect.png" alt="GitSync" />

</div>

## Delete GitSync configuration

To delete the GitSync configuration, go to the **Configure git** tab on the **Workspace settings** page, and click on the **Delete configuration** button. This will delete the SSH key from the GitHub repository and the GitSync feature will be disabled.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/deleteconfig.png" alt="GitSync" />

</div>

## Git repo

Once the initial commit is made, you can see the app files in the git repository. The repository will have the individual app folders and a **.meta** folder. The app folders will be named as the app name and will have the respective **JSON** file of the application. The **.meta** folder will have the `meta.json` file that contains the meta information of each application synced to git repo.

The **meta.json** file holds information about apps such as the **App name**, **last commit message**, **last commit user**, **last commit date**, **version name**, and **version id**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/gitcommit.png" alt="GitSync" />

</div>

## Pushing changes to git repo

Once the GitSync feature is configured, you can start pushing changes to the git repository. 

### App creation

When you create a new app, you will see an option to select the `Commit changes`. If you select the `commit changes` option, the changes will be committed to the git repository.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/commitchanges.png" alt="GitSync" />

</div>
<br/>

Selecting the `Commit changes` option will create a new commit in the git repository. The commit message will be `App creation` and the author will be the user who created the app.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/firstcommit.png" alt="GitSync" />

</div>

### App rename

Whenever an app is renamed, the changes will be automatically committed to the git repository. The commit message will be `App is renamed` and the author will be the user who renamed the app.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/rename.png" alt="GitSync" />

</div>

### App updates

Whenever a user makes a change in an app, they can make a commit to the git repository by clicking on the **GitSync** button on the topbar. On clicking the **GitSync** button, a modal will open with the option to enter the commit message. The user can enter the commit message and click on the **Commit changes** button to commit the changes to the git repository. Along with the commit message, the user can also see the connnected **Git repo URL** and the **last commit details**.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/modalgit.png" alt="GitSync" />

</div>
<br/>

Once the changes are committed, the user can see the commit message, author, and date in the git repository.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/commitgitsync.png" alt="GitSync" />

</div>

### App version update

Whenever a user creates a new app version and creates a commit to git repository, the **JSON** file in the app folder will be replaced with the new version of the app that was created. The **meta.json** file in the **.meta** folder will also be updated with the new version id and version name.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/replace.png" alt="GitSync" />

</div>

## Pulling changes from git repo

You can configure the GitSync feature on another workspace to pull the changes from the git repository. To configure the GitSync feature on another workspace, follow the steps mentioned in the [Setting up GitSyncing with GitHub](#setting-up-git-syncing-with-github) section.

Once the GitSync feature is configured, go to the ToolJet dashboard and click on the three dots on the right side of the **Create new app** button. Click on the **Import from git repository** option.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/importgit.png" alt="GitSync" />

</div>
<br/>

On clicking the **Import from git repository** option, a modal will open with the dropdown to select the app to be imported from the git repository. Once the app is selected, the app name and the last commit will be displayed. Click on the **Import app** button to import the app from the git repository. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/importmodal.png" alt="GitSync" />

</div>

:::caution
The apps imported from the git repository cannot be edited.
:::

### Checking for updates

You can check for updates in the git repository by clicking on the **GitSync** button on the topbar. On clicking the **GitSync** button, a modal will open with the option to **Check for updates**. Click on the **Check for updates** button to check for updates in the git repository. If there are any updates, you will see the details of the updates such as commit message, author, and the date in the modal. Click on the **Pull changes** button to pull the changes from the git repository.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/updatecheck.png" alt="GitSync" />

</div>