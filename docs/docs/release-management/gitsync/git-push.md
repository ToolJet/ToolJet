---
id: git-push
title: Pushing Changes to Git Repo
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Once the GitSync feature is configured, you can start pushing changes to the git repository. 

## App Creation

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

## App Rename

Whenever an app is renamed, the changes will be automatically committed to the git repository. The commit message will be `App is renamed` and the author will be the user who renamed the app.

<Tabs>

    <TabItem value="GitHub" label="GitHub"> 

        <img className="screenshot-full" src="/img/gitsync/rename.png" alt="GitSync" />

    </TabItem>

    <TabItem value="GitLab" label="GitLab"> 

        <img className="screenshot-full" src="/img/gitsync/gitlab/apprename.png" alt="GitSync" />

    </TabItem>

</Tabs>

## App Updates

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

## App Deletion

Whenever a user deleted an app from the workspace, the app will not be deleted from the git repository. The app will be available in the git repository in the same state as it was before the app was deleted.

## App Version Update

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

## Auto-commit on Promoting Environment

When you promote an environment, from **Developement to Staging**, the changes will be automatically committed to the git repository. The commit message will be `<version_number> Version of <app_name> promoted from <source_environment> to <destination_environment>`. The author will be the user who promoted the environment. When you promote an environment, from **Staging to Production**, no changes will be committed to the git repository.

<img className="screenshot-full" src="/img/gitsync/promoted.png" alt="GitSync" />

This option can be enabled or disabled from the **Configure git** tab on the **Workspace settings** page. By default, this option is disabled.

<img className="screenshot-full" src="/img/gitsync/autocommit-v2.png" alt="GitSync" />
