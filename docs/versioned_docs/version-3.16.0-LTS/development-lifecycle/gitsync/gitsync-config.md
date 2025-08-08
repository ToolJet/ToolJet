---
id: gitsync-config
title: Configure GitSync
---

In this guide, we will explore how to configure git sync using GitHub as the repository manager. By default git sync is configured for the **master** branch, but this can be configured to a different branch as well, refer to **[Configuring git sync on a Different Branch](#configuring-gitsync-on-a-different-branch)** section for more information.

For more information on using other repository managers, such as GitLab or Gitea, refer to the **[SSH Configuration for Git Repo Manager](/docs/development-lifecycle/gitsync/ssh-config)** guide.

## Setting up GitSync in ToolJet

Role Required: **Admin**

1. **Create a New Repository** <br/>
    Create a new repository on your GitHub. The repository can be public or private. You can also use an existing repository. Make sure that the repository is empty.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/new-repo.png" alt="git sync" />

2. **Obtain the SSH URL** <br/>
    When a repository is created, GitHub shows a screen with the SSH URL.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/ssh.png" alt="git sync" />

    OR
    
    If you are using an existing repository, then you can obtain the URL by clicking on the **Code** button.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/ssh-code.png" alt="git sync" />

    To generate the SSH URL for other git repository manager, such as GitLab and Gitea, follow the **[SSH Configuration](/docs/development-lifecycle/gitsync/ssh-config#generating-ssh-url)** guide.

3. Go to the **Workspace settings**, and click on the **Configure git** tab. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/configure-git`)

    <img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/gitsync/gitsync-v3.png" alt="GitLab Repo" />

4. Enter the **SSH URL** of the repository in the **Git repo URL** field.

5. Click on the **Generate SSH key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

    <img className="screenshot-full img-full" src="/img/development-lifecycle/gitsync/config/generate-ssh.png" alt="git sync" />

    There are two types of generated SSH keys:
    - **ED25519**: This is a secure and efficient algorithm that is used for generating SSH keys. It is recommended to use this key type. VCS providers like GitHub and GitLab recommend using this key type
    - **RSA**: This is an older algorithm that is used for generating SSH keys. It is not recommended to use this key type. Providers like Bitbucket recommend using this key type. <br/> <br/>

    <img className="screenshot-full img-full" src="/img/development-lifecycle/gitsync/config/ssh-key.png" alt="git sync" />

6. Go to the **Settings** tab of the GitHub repository, and click on the **Deploy keys** tab. Click on the **Add deploy key** button. 
    <img className="screenshot-full img-full" src="/img/development-lifecycle/gitsync/config/deploy-ssh.png" alt="git sync" />

7. Enter a title for the SSH key in the **Title** field. 
        
8. Paste the SSH key generated from the ToolJet. 

9. Make sure that the **Allow write access** checkbox is checked, especially when configuring the git sync feature to [push changes to Git](/docs/development-lifecycle/gitsync/push). However, it is not mandatory to check this option when setting up the git sync feature for [pulling changes from Git](/docs/development-lifecycle/gitsync/pull).
        
10. Finally, click on the **Add key** button.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/add-key.png" alt="git sync" />

    To deploy the SSH key for other git repository manager, such as GitLab and Gitea, follow the **[SSH Configuration](/docs/development-lifecycle/gitsync/ssh-config#deploy-the-ssh-key)** guide.

11. After deploying the SSH Key, go to the **Configure git** tab on ToolJet, and click on the **Finalize setup** button. If the SSH key is configured correctly, you will see a success message.
    <img className="screenshot-full img-full" src="/img/development-lifecycle/gitsync/config/save-config.png" alt="git sync" />

## Configuring GitSync on a Different Branch

ToolJet git sync allows you to sync your applications with a Git repository to enable version control and team collaboration. By default, git sync operates on the `main` branch, but in multi-environment setups (like staging, production, or feature development), teams often need to sync with custom branches. ToolJet supports this by allowing you to configure a custom Git branch for syncing.


You can configure the git sync target branch in two ways:

### Using the ToolJet UI (Recommended)
ToolJet now supports setting the Git branch directly through the UI when configuring git sync for a workspace.

- You’ll find an optional Target Branch input while setting up git sync.

- Simply enter the desired branch name (e.g., develop, release/v1, etc.).

- If left empty:

    - For new users, the default branch will be **main**.

    - For existing users, the default will be master to maintain backward compatibility.

This is the preferred way to set the target branch going forward.

 <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/custom-branch.png" alt="git sync" />



### Using the Environment Variable
ToolJet also supports configuring the target branch using an environment variable. This is configured at the instance level and applies globally to all workspaces with git sync enabled. The branch specified here must exist in all Git repositories used for git sync across your workspaces.

To set this, add the following to your .env file: <br/>
`GITSYNC_TARGET_BRANCH` = **branch-name**

:::note
- Existing git sync users, who want to use a custom Git branch must first create a new custom branch from the master branch in the Git repository manager.
- If both the UI configuration and the environment variable are set, the environment variable (`GITSYNC_TARGET_BRANCH`) will take precedence over the UI setting.
:::
