---
id: gitsync
title: GitSync
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>


The GitSync feature enables synchronization of workspace applications with a git repository, streamlining application management and version control on ToolJet.

<div style={{paddingTop:'24px'}}>

## Overview

ToolJet applications can be synchronized with a Git repository, offering the flexibility to tailor your application development and deployment processes across various environments while aligning with best practices for the application development lifecycle.

#### Key Use-Cases

**Backup of Apps**

GitSync provides a straightforward solution for creating backups of your applications. By pushing changes to a Git repository, users can ensure a secure and versioned history of their application. This serves as a reliable backup mechanism, safeguarding against accidental application/version deletion or corruption.

**Environment Migration**

Facilitating the movement of applications across different ToolJet deployments (e.g., from development to staging to production), GitSync acts as a pivotal tool for environment migration. Users can effortlessly transfer their applications across environments by pushing changes to a Git repository.

<img className="screenshot-full" src="/img/gitsync/envmigration.png" alt="GitSync" />

</div>

<div style={{paddingTop:'24px'}}>

## Setting up GitSync

:::info
- GitSync integrates with self-hosted Git repository managers, such as Gitea, Gogs, and other local Git management solutions.
- ToolJet support git repo managers like GitHub, GitLab, Bitbucket, AWS CodeCommit, and Azure Repos.
- Only Admins have the permission to configure the GitSync feature on workspace level.
- The default branch name for the git repository should be **master**.
:::

### 1. Create a New Repository

Create a new repository on your git repo manager. The repository can be public or private. You can also use an existing repository. **Make sure that the repository is empty.**

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/github1.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/repo.png" alt="GitSync" />

    </TabItem>

</Tabs>

### 2. Obtain the Repository URL

Obtain the **SSH URL** of your repository.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        When a repository is created, GitHub shows a screen with the repository URL. If the repository is already created, you can obtain the URL by clicking on the **Clone or download** button.
        <img className="screenshot-full" src="/img/gitsync/github2.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        On GitLab, you can obtain the URL by clicking on the **Clone** button and selecting the **SSH** option.
        <img className="screenshot-full" src="/img/gitsync/gitlab/gitlabssh.png" alt="GitSync" />

    </TabItem>

</Tabs>

### 3. Configure the GitSync Feature on ToolJet

    1. Go to the **Workspace settings**, and click on the **Configure git** tab.

    <img className="screenshot-full" src="/img/gitsync/gitsync.png" alt="GitLab Repo" />

    2. Enter the **SSH URL** of the repository (obtained in [Step 2](#2-obtain-the-repository-url)) in the **Git repo URL** field.
    3. Click on the **Generate SSH key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

    <img className="screenshot-full" src="/img/gitsync/ssh2-v2.png" alt="GitSync" />

    There are two types of generated SSH keys:
    - **ED25519**: This is a secure and efficient algorithm that is used for generating SSH keys. It is recommended to use this key type. VCS providers like GitHub and GitLab recommend using this key type
    - **RSA**: This is an older algorithm that is used for generating SSH keys. It is not recommended to use this key type. Older VCS providers like Bitbucket recommend using this key type.

    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/gitsync/ssh2.png" alt="GitSync" />

### 4. Deploy the SSH Key

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 
        
        Follow the following steps to deploy the SSH key to GitHub Repository:

        1. Go to the **Settings** tab of the GitHub repository that you created in [Step 1](#1-create-a-new-repository), and click on the **Deploy keys** tab. Click on the **Add deploy key** button. 

        <img className="screenshot-full" src="/img/gitsync/github3.png" alt="GitSync" />

        2. Enter a title for the SSH key in the **Title** field. 
        3. Paste the SSH key that you copied in [Step 3](#3-configure-the-gitsync-feature-on-tooljet) in the **Key** field. 
        4. Make sure that the **Allow write access** checkbox is checked, especially when configuring the GitSync feature to [push changes to Git](#pushing-changes-to-git-repo). However, it is not mandatory to check this option when setting up the GitSync feature for [pulling changes from Git](#pulling-changes-from-git-repo).
        5. Finally, click on the **Add key** button.

        <img className="screenshot-full" src="/img/gitsync/github4.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        You have two options to add the SSH key to GitLab, depending on your needs:

        #### Option 1: Add as a User-Wide SSH Key
        
        Use this option for access to all your repositories.

        1. Click on your avatar in the top-left corner and select **Edit Profile**.
        2. Navigate to the **SSH Keys** tab and click the **Add new key** button.

        <img className="screenshot-full" src="/img/gitsync/gitlab/addingssh.png" alt="GitLab SSH Key" />

        3. In the **Key** field, paste the SSH key you generated in [Step 3](#3-configure-the-gitsync-feature-on-tooljet).
        4. Give your key a descriptive title.
        5. Set **Usage type** to **Authentication & signing**.
        6. Optionally, set an expiration date.
        7. Click **Add key** to save.

        <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/gitsync/gitlab/activessh.png" alt="GitLab SSH Key" />

        #### Option 2: Add as a Deploy Key 

        Use this option for access to a specific repository only.

        1. Navigate to the repository you want to add the key to.
        2. Click on the **Settings** tab and select **Repository**.
        3. Once you are in the **Repository Settings**, expand the **Deploy Keys** section.
        4. Click on the **Add new deploy key** button.
        5. Give your key a descriptive title.
        6. In the **Key** field, paste the SSH key you generated in ToolJet's Configure Git tab during the previous step.
        7. Enable the **Grant write permissions to this key** checkbox. We need this permission to push changes to the repository.
        8. Click **Add key** to save.

        <img className="screenshot-full" src="/img/gitsync/gitlab/deploy-keys.png" alt="GitLab Deploy Key" />

    </TabItem>

</Tabs>

### 5. Finish the GitSync Configuration on ToolJet

Go back to the **Configure git** tab on ToolJet, and click on the **Finalize setup** button. If the SSH key is configured correctly, you will see a success message.

<img className="screenshot-full" src="/img/gitsync/finalize-ssh2-configuration-v2.png" alt="GitSync" />

</div>

<div style={{paddingTop:'24px'}}>

## Auto-commit on Promoting Environment

When you promote an environment, from **Developement to Staging**, the changes will be automatically committed to the git repository. The commit message will be `<version_number> Version of <app_name> promoted from <source_environment> to <destination_environment>`. The author will be the user who promoted the environment. When you promote an environment, from **Staging to Production**, no changes will be committed to the git repository.

<img className="screenshot-full" src="/img/gitsync/promoted.png" alt="GitSync" />

This option can be enabled or disabled from the **Configure git** tab on the **Workspace settings** page. By default, this option is disabled.

<img className="screenshot-full" src="/img/gitsync/autocommit-v2.png" alt="GitSync" />

</div>

<div style={{paddingTop:'24px'}}>

## Enable/Disable GitSync

To enable or disable the GitSync feature, go to the **Configure git** tab on the **Workspace settings** page, and toggle on/off the **Connect** switch. This is only available if the GitSync feature is configured.

#### When Enabled

On clicking the GitSync button, the users will be able to commit changes to the git repository.

#### When Disabled

1. **For non-admin users**: The users will not be able to commit changes to the git repository. They will see a dialogue box that the GitSync feature is not configured and they need to contact the admin to configure it.
2. **For admin users**: The users will see a dialogue box with a link to configure the GitSync feature.

<img className="screenshot-full" src="/img/gitsync/connect-v2.png" alt="GitSync" />

</div>

<div style={{paddingTop:'24px'}}>

## Delete GitSync Configuration

To delete the GitSync configuration, go to the **Configure git** tab on the **Workspace settings** page, and click on the **Delete configuration** button. This will delete the SSH key from the ToolJet configuration and the GitSync feature will be disabled.

**Note:** Deleting the GitSync configuration will not delete the apps from the git repository. The apps will still be available in the git repository in the same state as they were before the GitSync configuration was deleted.

<img className="screenshot-full" src="/img/gitsync/deleteconfig-v2.png" alt="GitSync" />

</div>

<div style={{paddingTop:'24px'}}>

## Git Repo

Once the initial commit is made, you can see the app files in the git repository. The repository will have the individual app folders and a **.meta** folder. The app folders will be named as the app name and will have the respective **JSON** file of the application. The **.meta** folder will have the **meta.json** file that contains the meta information of each application synced to git repo.

The **meta.json** file holds information about apps such as the **App name**, **last commit message**, **last commit user**, **last commit date**, **version name**, and **version id**.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/gitcommit.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/firstcommit.png" alt="GitSync" />

    </TabItem>

</Tabs>

</div>

<div style={{paddingTop:'24px'}}>

## Pushing Changes to Git Repo

Once the GitSync feature is configured, you can start pushing changes to the git repository. 

#### App Creation

When you create a new app, you will see an option to select the **Commit changes**. If you select the **commit changes** option, the changes will be committed to the git repository.

:::info
If the app name is same as the name of the existing app in the git repo, it will overwrite the existing app in the git repo.
:::

<img className="screenshot-full" src="/img/gitsync/commitchanges.png" alt="GitLab SSH Key" />

Selecting the **Commit changes** option will create a new commit in the git repository. The commit message will be `App creation` and the author will be the user who created the app.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/firstcommit.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/author.png" alt="GitSync" />

    </TabItem>

</Tabs>

#### App Rename

Whenever an app is renamed, the changes will be automatically committed to the git repository. The commit message will be `App is renamed` and the author will be the user who renamed the app.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/rename.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/apprename.png" alt="GitSync" />

    </TabItem>

</Tabs>

#### App Updates

Whenever a user makes a change in an app, they can make a commit to the git repository by clicking on the **GitSync** button on the topbar. On clicking the **GitSync** button, a modal will open with the option to enter the commit message. The user can enter the commit message and click on the **Commit changes** button to commit the changes to the git repository. Along with the commit message, the user can also see the connnected **Git repo URL** and the **last commit details**. 

**Last commit details** helps the user to know the last commit message, author, date, and time. This helps the user to know the last commit details and make the commit message accordingly.

<img className="screenshot-full" src="/img/gitsync/gitlab/message.png" alt="GitLab SSH Key" />

Once the changes are committed, the user can see the commit message, author, and date in the git repository.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/commitgitsync.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/lastcommitmsg.png" alt="GitSync" />

    </TabItem>

</Tabs>

#### App Deletion

Whenever a user deleted an app from the workspace, the app will not be deleted from the git repository. The app will be available in the git repository in the same state as it was before the app was deleted.

#### App Version Update

When a user creates a new version of an app, there will be an option to select the **Commit changes**. If you select the **commit changes** option, the new version of the app will be committed to the git repository.

<img className="screenshot-full" src="/img/gitsync/gitlab/newversion.png" alt="GitLab SSH Key" />

The **JSON** file in the app folder will be replaced with the new version of the app, the **meta.json** file in the **.meta** folder gets updated with the new version id and version name. The commit message will be `Version creation` and the author will be the user who created the new version of the app. 

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/replace.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/newversion1.png" alt="GitSync" />

    </TabItem>

</Tabs>

</div>

<div style={{paddingTop:'24px'}}>

## Pulling Changes from Git Repo

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

#### Checking for Updates

You can check for updates in the git repository by clicking on the **GitSync** button on the topbar. On clicking the **GitSync** button, a modal will open with the option to **Check for updates**. Click on the **Check for updates** button to check for updates in the git repository. If there are any updates, you will see the details of the updates such as commit message, author, and the date in the modal. Click on the **Pull changes** button to pull the changes from the git repository.

<img className="screenshot-full" src="/img/gitsync/updatecheck.png" alt="GitSync" />

</div>
