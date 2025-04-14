---
id: gitlab
title: GitLab
---

In this guide, we will explore how to configure GitSync using GitLab as the repository manager. By default GitSync is configured for the **main** branch, but this can be configured to a different branch as well, refer to **[Configuring GitSync on a Different Branch](#configuring-gitsync-on-a-different-branch)** section for more information.

To configure GitSync for other standard Git repository managers refer to **[GitHub](/docs/development-lifecycle/gitsync/configure-gitsync/gitsync-config)** or **[Gitea](/docs/development-lifecycle/gitsync/configure-gitsync/gitea)**.

## Setting up GitSync in ToolJet

1. **Create a New Repository** <br/>
    Create a new repository on your GitLab. The repository can be public or private. You can also use an existing repository. Make sure that the repository is empty and the default branch name should be **main**.
    <img className="screenshot-full" src="/img/gitsync/gitlab/repo-v3.png" alt="GitSync" />

2. **Obtain the SSH URL** <br/>
    On GitLab, you can obtain the URL by clicking on the **Code** button and selecting the **Clone with SSH** option.
    <img className="screenshot-full" src="/img/gitsync/gitlab/gitlabssh-v3.png" alt="GitSync" />

3. Go to the **Workspace settings**, and click on the **Configure Git** tab. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/configure-git`)

    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/gitsync-v4.png" alt="GitLab Repo" />

4. Enter the **SSH URL** of the repository in the **Git repo URL** field.

5. Click on the **Generate SSH key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/generate-ssh.png" alt="GitSync" />

    There are two types of generated SSH keys:
    - **ED25519**: This is a secure and efficient algorithm that is used for generating SSH keys. It is recommended to use this key type. VCS providers like GitHub and GitLab recommend using this key type
    - **RSA**: This is an older algorithm that is used for generating SSH keys. It is not recommended to use this key type. Providers like Bitbucket recommend using this key type. <br/> <br/>

    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/ssh-key.png" alt="GitSync" />

6. Adding an SSH Key to GitLab:

    You have two options for adding the SSH key to GitLab, you can either add it globally to access all your repositories or deploy it for a specific repository.

    #### Option 1: Add as a User-Wide SSH Key
            
    Use this option for access to all your repositories.

        1. Click on your avatar in the top-left corner and select **Edit profile**.

        2. Navigate to the **SSH Keys** tab and click the **Add new key** button.
       
        3. In the **Key** field, paste the SSH key you generated from the ToolJet. Give your key a descriptive title.
            
        4. Set **Usage type** to **Authentication & Signing**.
            
        5. Optionally, set an **Expiration date**.
            
        6. Click **Add key** to save.
         <img className="screenshot-full" src="/img/gitsync/gitlab/addingssh-v2.png" alt="GitLab SSH Key" />

    #### Option 2: Add as a Deploy Key 

    Use this option for access to a specific repository only.

        1. Navigate to the repository you want to add the key to.
                
        2. Click on the **Settings** tab and select **Repository**, expand the **Deploy Keys** section.
                
        3. Click on the **Add new key** button. 

        4. In the **Key** field, paste the SSH key you generated from the ToolJet. Give your key a descriptive title.

        5. Enable the **Grant write permissions to this key** checkbox. We need this permission to push changes to the repository.

        6. Optionally, set an **Expiration date**.

        7. Click **Add key** to save.
        <img className="screenshot-full" src="/img/gitsync/gitlab/deploy-keys-v2.png" alt="GitLab Deploy Key" />

7. After deploying the SSH Key, go to the **Configure Git** tab on ToolJet, and click on the **Finalize setup** button. If the SSH key is configured correctly, you will see a success message.
    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/save-config-v2.png" alt="GitSync" />

## Configuring GitSync on a Different Branch

Starting from version **v3.5.3-ee-lts**, GitSync in ToolJet supports custom branches. This feature is available only in the Self-Hosted version of ToolJet. The custom branch for GitSync is configured at the instance level via an environment variable.

Different repositories can be configured for different workspaces, but the custom branch set in the **.env** file must be present in all configured repositories to ensure smooth operation. The branch specified in the **.env** file will apply to all workspaces with GitSync support.

To configure a custom branch for GitSync, you need to set the following environment variable in your **.env** file:  <br/>
`GITSYNC_TARGET_BRANCH` = **branch-name**

**Note:** **Existing GitSync users** who want to use a custom Git branch must first create a new custom branch from the master branch in the Git repository manager. Then, they must configure the branch name in the **.env** file to ensure all operations work smoothly.