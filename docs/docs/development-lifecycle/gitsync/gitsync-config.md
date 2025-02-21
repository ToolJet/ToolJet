---
id: gitsync-config
title: Configure GitSync
---

In this guide, we will explore how to configure GitSync using GitHub as the repository manager. By default GitSync is configured for the **master** branch, but this can be configured to a different branch 

For more information on using other repository managers, such as GitLab or Gitea, refer to the **[SSH Configuration for Git Repo Manager](#)** guide.

## Setting up GitSync in ToolJet

Role Required: **Admin**

1. **Create a New Repository** <br/>
    Create a new repository on your GitHub. The repository can be public or private. You can also use an existing repository. Make sure that the repository is empty.
    <img className="screenshot-full" src="/img/gitsync/github1.png" alt="GitSync" />

2. **Obtain the SSH URL** <br/>
    When a repository is created, GitHub shows a screen with the SSH URL.
    <img className="screenshot-full" src="/img/gitsync/github2.png" alt="GitSync" />

    OR
    
    If you are using an existing repository, then you can obtain the URL by clicking on the **Code** button.
    <img className="screenshot-full" src="/img/gitsync/ssh-url.png" alt="GitSync" />

    To generate the SSH URL for other git repository manager, such as GitLab and Gitea, follow the **[SSH Configuration](/docs/release-management/gitsync/ssh-config#generating-ssh-url)** guide.

3. Go to the **Workspace settings**, and click on the **Configure git** tab. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/configure-git`)

    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/gitsync/gitsync-v3.png" alt="GitLab Repo" />

4. Enter the **SSH URL** of the repository in the **Git repo URL** field.

5. Click on the **Generate SSH key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

    <img className="screenshot-full" src="/img/gitsync/ssh2-v2.png" alt="GitSync" />

    There are two types of generated SSH keys:
    - **ED25519**: This is a secure and efficient algorithm that is used for generating SSH keys. It is recommended to use this key type. VCS providers like GitHub and GitLab recommend using this key type
    - **RSA**: This is an older algorithm that is used for generating SSH keys. It is not recommended to use this key type. Providers like Bitbucket recommend using this key type. <br/> <br/>

    <img className="screenshot-full" src="/img/gitsync/ssh2.png" alt="GitSync" />

6. Go to the **Settings** tab of the GitHub repository, and click on the **Deploy keys** tab. Click on the **Add deploy key** button. 
    <img className="screenshot-full" src="/img/gitsync/github3.png" alt="GitSync" />

7. Enter a title for the SSH key in the **Title** field. 
        
8. Paste the SSH key generated from the ToolJet. 

9. Make sure that the **Allow write access** checkbox is checked, especially when configuring the GitSync feature to [push changes to Git](#pushing-changes-to-git-repo). However, it is not mandatory to check this option when setting up the GitSync feature for [pulling changes from Git](#pulling-changes-from-git-repo).
        
10. Finally, click on the **Add key** button.
    <img className="screenshot-full" src="/img/gitsync/github4.png" alt="GitSync" />

    To deploy the SSH key for other git repository manager, such as GitLab and Gitea, follow the **[SSH Configuration](/docs/release-management/gitsync/ssh-config#deploy-the-ssh-key)** guide.

11. After deploying the SSH Key, go to the **Configure git** tab on ToolJet, and click on the **Finalize setup** button. If the SSH key is configured correctly, you will see a success message.
    <img className="screenshot-full" src="/img/gitsync/finalize-ssh2-configuration-v2.png" alt="GitSync" />

## Configuring GitSync on a Different Branch

Starting from version **v3.5.3-ee-lts**, GitSync supports custom branches. This feature is available only in the Self-Hosted version of ToolJet, and the Git repository can only be configured at the instance level. This means that if you use a custom branch for GitSync, you cannot configure different repositories for different workspaces.

To configure a custom branch for the GitSync, you need to set the following environment variable in your **.env** file: <br/>
`GITSYNC_TARGET_BRANCH` = **branch-name**

**Note:** **Existing GitSync users** must create the new custom branch from the master branch to retain all previous commits.