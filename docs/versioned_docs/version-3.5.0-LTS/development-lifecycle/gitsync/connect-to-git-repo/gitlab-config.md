---
id: gitlab-config
title: GitLab Configuration
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


The GitLab configuration for git sync offers a flexible way to connect your ToolJet instance to a Git repository. This setup uses HTTPS instead of the traditional SSH-based method, eliminating the need to manage SSH keys and bypassing SSH port blocks. You can also select and switch repository branches directly within the ToolJet interface.


Role Required: **Admin**

### 1. **Create a New Project** 
    Create a new project in your GitLab account. You can choose to make it public or private. If you’re using an existing repository, ensure it’s empty before proceeding.


### 2. Get the GitLab Project ID
    To get the project ID, navigate to your project's settings and look for the *Project ID* field under the General section. This value represents the unique identifier assigned by GitLab to your project. Save this value for later use.


### 3. Generate a Personal Access Token
Follow these steps to generate a [personal access token](https://docs.gitlab.com/user/project/settings/project_access_tokens/#create-a-project-access-token):
- Go to your Project Settings and click on *Access Tokens*
- Enter name for your token.
- Select a role as Developer, Maintainer, or Owner
- Select the required scopes. The mandatory scopes are:
        - api
        - read_api
        - read_repository
        - write_repository
- Click the Create personal access token button.

Once generated, copy and store the token as it won't be displayed again. This token will be used later when configuring git sync.

### 4. Configure GitLab in git sync 

Navigate to the **Workspace settings** page and click on the **Configure git** tab. Then, enter the required configuration values after selecting GitLab as your repository provider.

<img className="screenshot-full img-s" src="/img/gitsync/gitlab-config/config.png" alt="git sync" />


The table below describes each configuration values:

#### Repository
| **Setting**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **Repo URL**              | The URL of the Project you created to use with ToolJet. (e.g `https://gitlab.com/<group-name>/<project-name>` or `https://gitlab.com/<username>/<project-name>`)                                          |
| **Branch name**         | Branch name of your project. By default, it uses the main branch.                                                                                      |

#### Self-hosted GitLab (Optional)
| **Setting**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **GitLab enterprise URL**             |    The domain used to access your self-hosted GitLab instance. (e.g `https://gitlab.corp.com`) If you use GitLab Cloud, you can leave this blank.                                                                                        |

#### Project Access Configuration
| **Setting**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **GitLab Project ID**                    | The [GitLab project ID](https://docs.gitlab.com/user/project/working_with_projects/#find-the-project-id). |
| **GitLab Project access token**           | The [GitLab project token](https://docs.gitlab.com/user/project/settings/project_access_tokens/#create-a-project-access-token).    |


    Once you've entered the necessary configurations, click **Save Changes**. Your workspace will now be connected to your GitLab project.