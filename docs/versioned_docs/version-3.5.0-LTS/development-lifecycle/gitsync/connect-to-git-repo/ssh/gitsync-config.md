---
id: gitsync-config
title: Configure GitSync
---
<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

In this guide, we will explore how to configure GitSync using GitHub as the repository manager. By default GitSync is configured for the **master** branch, but this can be configured to a different branch as well, refer to **[Configuring GitSync on a Different Branch](#configuring-gitsync-on-a-different-branch)** section for more information.

For more information on using other repository managers, such as GitLab or Gitea, refer to the **[SSH Configuration for Git Repo Manager](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config)** guide.

## Setting up GitSync in ToolJet

Role Required: **Admin**

1. **Create a New Repository** <br/>
    Create a new repository on your GitHub. The repository can be public or private. You can also use an existing repository. Make sure that the repository is empty.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/new-repo.png" alt="GitSync" />

2. **Obtain the SSH URL** <br/>
    When a repository is created, GitHub shows a screen with the SSH URL.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/ssh.png" alt="GitSync" />

    OR
    
    If you are using an existing repository, then you can obtain the URL by clicking on the **Code** button.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/ssh-code.png" alt="GitSync" />

    To generate the SSH URL for other git repository manager, such as GitLab and Gitea, follow the **[SSH Configuration](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#generating-ssh-url)** guide.

3. Go to the **Workspace settings**, and click on the **Configure git sync** tab. Select Git SSH Protocol as your Repository Connection. <br/>
    (Example URL - `https://app.corp.com/nexus/workspace-settings/configure-git`)

    <img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/gitsync/ssh/gitsync-home.png" alt="Git Sync" />


4. Enter the **SSH URL** of the repository in the **Git repo URL** field.

5. Click on the **Generate SSH key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

    <img className="screenshot-full img-l" src="/img/gitsync/ssh/ssh-url.png" alt="GitSync" />

    There are two types of generated SSH keys:
    - **ED25519**: This is a secure and efficient algorithm that is used for generating SSH keys. It is recommended to use this key type. VCS providers like GitHub and GitLab recommend using this key type
    - **RSA**: This is an older algorithm that is used for generating SSH keys. It is not recommended to use this key type. Providers like Bitbucket recommend using this key type. <br/> <br/>

    <img className="screenshot-full img-l" src="/img/gitsync/ssh/ssh-key.png" alt="GitSync" />

6. Go to the **Settings** tab of the GitHub repository, and click on the **Deploy keys** tab. Click on the **Add deploy key** button. 
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/deploy-ssh.png" alt="GitSync" />

7. Enter a title for the SSH key in the **Title** field. 
        
8. Paste the SSH key generated from the ToolJet. 

9. Make sure that the **Allow write access** checkbox is checked, especially when configuring the GitSync feature to [push changes to Git](/docs/development-lifecycle/gitsync/push). However, it is not mandatory to check this option when setting up the GitSync feature for [pulling changes from Git](/docs/development-lifecycle/gitsync/pull).
        
10. Finally, click on the **Add key** button.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/add-key.png" alt="GitSync" />

    To deploy the SSH key for other git repository manager, such as GitLab and Gitea, follow the **[SSH Configuration](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#deploy-the-ssh-key)** guide.

11. After deploying the SSH Key, go to the **Configure git** tab on ToolJet, and click on the **Finalize setup** button. If the SSH key is configured correctly, you will see a success message.
    <img className="screenshot-full img-l" src="/img/gitsync/ssh/config-success.png" alt="GitSync" />

## Configuring GitSync on a Different Branch

Starting from version **v3.5.3-ee-lts**, GitSync in ToolJet supports custom branches. This feature is available only in the Self-Hosted version of ToolJet. The custom branch for GitSync is configured at the instance level via an environment variable.

Different repositories can be configured for different workspaces, but the custom branch set in the **.env** file must be present in all configured repositories to ensure smooth operation. The branch specified in the **.env** file will apply to all workspaces with GitSync support.

To configure a custom branch for GitSync, you need to set the following environment variable in your **.env** file:  <br/>
`GITSYNC_TARGET_BRANCH` = **branch-name**

**Note:** **Existing GitSync users** who want to use a custom Git branch must first create a new custom branch from the master branch in the Git repository manager. Then, they must configure the branch name in the **.env** file to ensure all operations work smoothly.