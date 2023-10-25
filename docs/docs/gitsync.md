---
id: gitsync
title: Git Sync
---

Git Sync feature allows users to synchronize the applications on their workspace with a git repository. Git Sync feature simplifies the process of managing and version controlling your applications on ToolJet.

## Overview

ToolJet applications can be synchronized with a Git repository, offering the flexibility to tailor your application development and deployment processes across various environments while aligning with best practices for the application development lifecycle.

A common strategy involves maintaining multiple ToolJet instances, each representing distinct environments such as development, staging, and production. The progression of code between these environments is managed through Git. This means that every change undergoes a thorough review as a pull request before it can be promoted to a higher environment.

With this approach, developers can confidently build ToolJet applications within the development instance, conduct testing and quality assurance procedures within the staging instance, while end-users enjoy access to the applications in the production instance. This approach ensures a structured and controlled application development and deployment.

## Setting up Git Syncing with GitHub

:::caution GIT-REPOSITORY MANAGERS
ToolJet support git repo managers like GitHub, GitLab, Bitbucket, AWS CodeCommit, and Azure Repos.
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

### Step 3: Configure the Git Sync feature on ToolJet

Go to the **Workspace Settings**, and click on the **Configure Git** tab.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/gitsync.png" alt="Git Sync" />

</div>
<br/>

Enter the **SSH URL** of the repository (obtained in Step 2) in the **Git Repository URL** field. Click on the **Generate SSH Key** button, and copy the SSH key that is generated. The SSH key is used to authenticate ToolJet with the repository.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/git2.png" alt="Git Sync" />

</div>

### Step 4: Deploy the SSH key to GitHub repository

Go to the **Settings** tab of the GitHub repository that you created in Step 1, and click on the **Deploy keys** tab. Click on the **Add deploy key** button. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/github3.png" alt="GitHub" />

</div>

Enter a title for the SSH key in the **Title** field. Paste the SSH key that you copied in Step 3 in the **Key** field. Make sure that the **Allow write access** checkbox is checked. Click on the **Add key** button.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/github4.png" alt="GitHub" />

</div>

### Step 5: Finish the Git Sync configuration on ToolJet

Go back to the **Configure Git** tab on ToolJet, and click on the **Finalize Setup** button. If the SSH key is configured correctly, you will see a success message.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/gitsync/git5.png" alt="Git Sync" />

</div>

