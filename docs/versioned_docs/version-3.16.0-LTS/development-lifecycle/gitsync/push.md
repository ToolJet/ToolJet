---
id: push
title: Push Changes to Git Repo
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Once the GitSync feature is configured, you can start pushing changes to the git repository on following points:

- [App Creation](#app-creation)
- [Manual Commit Using GitSync Button](#manual-commit-using-gitsync-button)
- [Auto Commit on App Rename](#auto-commit-on-app-rename)
- [App Version Update](#app-version-update)
- [Auto Commit on Promoting Environment](#auto-commit-on-promoting-environment)
- [App Deletion](#app-deletion)

## App Creation

Whenever you create a new app, you will see an option to select the **Commit changes**. If you select the **commit changes** option, the changes will be committed to the git repository.

**Note**: If the app name is same as the name of an existing app in the git repo, it will overwrite the existing app in the git repo.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/commitchanges.png" alt="GitLab SSH Key" />

Selecting the **Commit changes** option will create a new commit in the git repository. The commit message will be `App creation` and the author will be the user who created the app.

During app creation, a **.meta** folder is generated, containing a **meta.json** file with details of the last commit. Then, an app folder is also created, storing **v1.json**, which holds app-specific details of v1 version.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/firstcommit.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/author.png" alt="GitSync" />

    </TabItem>

</Tabs>

## Manual Commit Using GitSync Button

Whenever a user makes a change in an app, they can make a commit to the git repository by following these steps:

1. After making the changes, click on the **GitSync** button on the topbar. 
    <img className="screenshot-full" src="/img/development-lifecycle/backup/gitsync/gitsync-button.png" alt="GitSync Button" />

2. On clicking the **GitSync** button, a modal will open with the option to enter the commit message. 
    <img className="screenshot-full" src="/img/development-lifecycle/backup/gitsync/commit-message.png" alt="GitSync Commit Message" />

3. Enter the commit message and click on the **Commit changes** button to commit the changes to the git repository. 

Along with the commit message, the user can also see the connected **Git repo URL** and the last commit details. **Last commit details** helps the user to know the last commit message, author, date, and time. This helps the user to know the last commit details and make the commit message accordingly.

Once the changes are committed, the user can see the commit message, author, and date in the git repository.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/development-lifecycle/backup/gitsync/github-commit.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/lastcommitmsg.png" alt="GitSync" />

    </TabItem>

</Tabs>

## Auto Commit on App Rename

Whenever an app is renamed, the changes will be automatically committed to the git repository. The commit message will be `App is renamed` and the author will be the user who renamed the app. Similarly an auto commit is generated whenever the version is renamed.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/rename.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/apprename.png" alt="GitSync" />

    </TabItem>

</Tabs>

## App Version Update

Whenever a user creates a new version of an app, there will be an option to select **Commit changes**. If the user selects **commit changes** option, the new version of the app will be committed to the git repository and the old version will be overridden.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/gitlab/newversion.png" alt="GitLab SSH Key" />

The **JSON** file in the app folder will be replaced with the new version of the app, the **meta.json** file in the **.meta** folder gets updated with the new version id and version name. The commit message will be **Version creation** and the author will be the user who created the new version of the app. 

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/replace.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/newversion1.png" alt="GitSync" />

    </TabItem>

</Tabs>

## Auto Commit on Promoting Environment

When you promote an environment, from **Development to Staging**, the changes will be automatically committed to the git repository. The commit message will be `<version_number> Version of <app_name> promoted from <source_environment> to <destination_environment>`. The author will be the user who promoted the environment. When you promote an environment, from **Staging to Production**, no changes will be committed to the git repository. This setting is common for all git sync configurations.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/promoted.png" alt="GitSync" />

This option can be enabled or disabled from the **Configure git** tab on the **Workspace settings** page. By default, this option is disabled.

<img className="screenshot-full" src="/img/gitsync/autocommit_.png" alt="GitSync" />

## App Deletion

Whenever a user delete an app from the workspace, the app will not be deleted from the git repository. The app will be available in the git repository in the same state as it was before the app was deleted.
