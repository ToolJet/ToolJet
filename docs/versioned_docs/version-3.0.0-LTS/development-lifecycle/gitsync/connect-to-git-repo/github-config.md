---
id: github-config
title: GitHub Configuration
sidebar_label: GitHub Configuration
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

This feature allows you to configure GitSync using GitHub as your repository manager. You can create a GitHub repository and set up a GitHub App for your ToolJet deployment instance, enabling it to commit, push, and pull changes.


Role Required: **Admin**

### 1. **Create a New Repository** 
    Create a new repository on your GitHub. The repository can be public or private. You can also use an existing repository. Make sure that the repository is empty.

### 2. **Create the GitHub App**
    [Setup a GitHub App](https://github.com/settings/apps/new) and make sure it is created by the same owner as the Git repository. If you have multiple ToolJet instances, use this same GitHub App across all instances. 

    <img className="screenshot-full img-l" style={{ marginBottom:'15px' }} src="/img/gitsync/github-config/github-app-register.png" alt="GitSync" />

    Enter your App details on the **Register new GitHub App** page and make sure to update the following fields:
    - Uncheck the **Expire user authorization tokens** and **Active** checkbox under **Identifying and authorizing users** and **Webhook** sections respectively.
    - Add the following Repository permissions:
        - Contents: Read & Write
        - Pull requests: Read & Write

    After creating the GitHub App, you will be directed to the **GitHub App Settings** page. Here, make sure to copy the **App ID**. Next, generate the **Private key** (`.pem `key), download it, and store it securely. This information will be essential later when configuring GitSync.

        <img className="screenshot-full img-l" src="/img/gitsync/github-config/github-app1.png" alt="GitSync" />

3. **Install the GitHub App** <br/>
    
    To install your GitHub App, follow these steps:

    - Click on Install App on the **GitHub App Settings** page.
    <img className="screenshot-full img-s" style={{ marginTop:'15px',marginBottom:'15px' }}  src="/img/gitsync/github-config/github-app2.png" alt="GitSync" />
    - Click the **Install** button next to your organization.
    - Select repositories option and select the repositories you want to connect to ToolJet.
    - You’ll be redirected to the installation page. The number at the end of the URL is the **installation ID**. Save this for later.

    ```
    https://github.com/settings/installations/:installation_id
    ```

### 3. Configure GitHub in GitSync 

Navigate to the **Workspace settings** page and click on the **Configure git** tab. Then, enter the required configuration values after selecting GitHub as your repository provider.

<div style={{ display:"flex", justifyContent:"left", gap:"1rem", marginTop:'15px', marginBottom:'15px' }}>
<img className="screenshot-full img-s" src="/img/gitsync/github-config/github-form1.png" alt="GitSync" />

<img className="screenshot-full img-s" src="/img/gitsync/github-config/github-form2.png" alt="GitSync" />
</div>

The table below describes each configuration values:

#### Repository
| **Setting**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **Repo URL**              | The URL of the repository you created to use with ToolJet. (e.g `https://github.com/your-org/repo-name.git`)                                          |
| **Branch name**         | Branch name of your repo. By default, it uses the main branch.                                                                                      |

#### Self-hosted GitHub (Optional)
| **Setting**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **GitHub enterprise URL**             |    The domain used to access your self-hosted GitHub instance. If you use GitHub Cloud, you can leave this blank.                                                                                        |
| **GitHub enterprise API URL**     |  The API endpoint for your self-hosted GitHub instance.  If you use GitHub Cloud, you can leave this blank. (e.g. `https://[hostname]/api/v3/`)                       |

#### App Access
| **Setting**                    | **Description**                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **GitHub app ID**                    | The [GitHub App ID](https://docs.github.com/en/developers/apps/identifying-and-authorizing-users-for-github-apps#authenticating-with-a-github-app). |
| **GitHub app installation ID**           | The [GitHub installation ID](https://docs.github.com/en/developers/apps/managing-github-apps/installing-github-apps#installing-a-github-app).    |
| **GitHub app private key**           | Private key you downloaded after App creation.                                                                                                                    |

    Once you've entered the necessary configurations, click **Save Changes**. Your ToolJet instance will now be connected to your GitHub repository.