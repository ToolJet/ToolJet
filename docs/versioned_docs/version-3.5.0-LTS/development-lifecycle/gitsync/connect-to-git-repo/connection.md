---
id: connection-method
title: Choose your connection method
---

When connecting your ToolJet application to a Git repository, you have two connection methods to choose from: SSH and HTTPS. Each method has its own advantages and considerations that might make one more suitable for your company. 


The table below provides a comparison between SSH and HTTPS connection methods to help you decide which one is best for your needs:

| Feature | HTTPS | SSH |
|---------|-----|-------|
| **Connection type** |  Individual git connection (Currently we only support [GitHub](/docs/development-lifecycle/gitsync/connect-to-git-repo/github-config) and [GitLab](/docs/development-lifecycle/gitsync/connect-to-git-repo/gitlab-config))  | Single connection which work for any git provider <br/> ( Example: [GitHub](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#github), [Gitea](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#gitea), [GitLab](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#gitlab), etc. )  |
| **Port Blocking** | No port blocking issues  | May face port blocking due to firewall issues  |
| **Branch Configuration** | Can be configured directly from the ToolJet UI | Must be configured using environment variables |
| **Default Branch** | main | master |
| **Require Github App** | Yes | No |

ToolJet allows you to set up multiple Git repository configurations. However, only one configuration can be active at any given time for a workspace. When switching between configurations, the previously active configuration will be automatically deactivated.

Choose the connection method that best aligns with your security requirements, network environment, and preferred way of managing your ToolJet applications with Git.