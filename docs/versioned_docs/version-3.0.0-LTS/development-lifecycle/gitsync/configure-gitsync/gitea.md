---
id: gitea
title: Gitea
---

In this guide, we will explore how to configure GitSync using Gitea as the repository manager. By default GitSync is configured for the **master** branch, but this can be configured to a different branch as well, refer to **[Configuring GitSync on a Different Branch](#configuring-gitsync-on-a-different-branch)** section for more information.
To configure GitSync for other standard Git repository managers refer to **[GitHub](/docs/development-lifecycle/gitsync/configure-gitsync/github)** or **[GitLab](/docs/development-lifecycle/gitsync/configure-gitsync/gitlab)**.

## Setting up GitSync in ToolJet

1. **Create a New Repository** <br/>
    Create a new repository on your Gitea. You can also use an existing repository. Make sure that the repository is empty and the default branch name should be **master**.
    <img className="screenshot-full" src="/img/gitsync/gitea/new-repo.png" alt="GitSync" />

2. **Obtain the SSH URL** <br/>
    When a repository is created, Gitea shows a screen with the SSH URL. 
    <img className="screenshot-full" src="/img/gitsync/gitea/ssh-url.png" alt="GitSync" />

3. Go to the **Workspace settings**, and click on the **Configure git** tab. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/configure-git`)

    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/gitsync-v3.png" alt="GitLab Repo" />

4. Enter the **SSH URL** of the repository in the **Git repo URL** field.

5. Click on the **Generate SSH key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/generate-ssh.png" alt="GitSync" />

    There are two types of generated SSH keys:
    - **ED25519**: This is a secure and efficient algorithm that is used for generating SSH keys. It is recommended to use this key type. VCS providers like GitHub and GitLab recommend using this key type
    - **RSA**: This is an older algorithm that is used for generating SSH keys. It is not recommended to use this key type. Providers like Bitbucket recommend using this key type. <br/> <br/>

    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/ssh-key.png" alt="GitSync" />

6. Go to the **Settings** tab of the Gitea repository, and click on the **Deploy keys** tab. Click on the **Add deploy key** button. 
    <img className="screenshot-full" src="/img/gitsync/gitea/deploy-ssh.png" alt="GitSync" />

7. Enter a title for the SSH key in the **Title** field. 
        
8. Paste the SSH key generated from the ToolJet. 

9. Make sure that the **Allow write access** checkbox is checked, especially when configuring the GitSync feature to [push changes to Git](/docs/development-lifecycle/gitsync/push). However, it is not mandatory to check this option when setting up the GitSync feature for [pulling changes from Git](/docs/development-lifecycle/gitsync/pull).
        
10. Finally, click on the **Add Deploy key** button.
    <img className="screenshot-full" src="/img/gitsync/gitea/final.png" alt="GitSync" />

11. After deploying the SSH Key, go to the **Configure git** tab on ToolJet, and click on the **Finalize setup** button. If the SSH key is configured correctly, you will see a success message.
    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/save-config.png" alt="GitSync" />

## Configuring GitSync on a Different Branch

Starting from version **v3.5.3-ee-lts**, GitSync in ToolJet supports custom branches. This feature is available only in the Self-Hosted version of ToolJet. The custom branch for GitSync is configured at the instance level via an environment variable.

Different repositories can be configured for different workspaces, but the custom branch set in the **.env** file must be present in all configured repositories to ensure smooth operation. The branch specified in the **.env** file will apply to all workspaces with GitSync support.

To configure a custom branch for GitSync, you need to set the following environment variable in your **.env** file:  <br/>
`GITSYNC_TARGET_BRANCH` = **branch-name**

**Note:** **Existing GitSync users** who want to use a custom Git branch must first create a new custom branch from the master branch in the Git repository manager. Then, they must configure the branch name in the **.env** file to ensure all operations work smoothly.