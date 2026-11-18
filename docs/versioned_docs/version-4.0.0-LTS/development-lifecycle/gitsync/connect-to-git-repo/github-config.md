---
id: github-config
title: GitHub Configuration
sidebar_label: GitHub Configuration
---

<PlanBadge type="team" />

Connect your workspace to a GitHub repository through a GitHub App. The connection works over HTTPS, and you choose the branch to sync with directly in ToolJet.

Role Required: **Admin**

### 1. Create a New Repository and Make an Initial Commit
    Create a new repository on your GitHub. The repository can be public or private. You can also use an existing repository. Make sure that the repository is empty, then create an initial commit (for example, by adding a **README.md**). This first commit initializes the repository and creates the default branch (such as **main**).

### 2. Create the GitHub App
    [Setup a GitHub App](https://github.com/settings/apps/new) and make sure it is created by the same owner as the Git repository. If you have multiple ToolJet instances, use this same GitHub App across all instances. 
    <img className="screenshot-full img-l" src="/img/gitsync/github-config/github-app-register.png" alt="Register new GitHub App page with the GitHub App name, description, and Homepage URL fields" />
    
    Enter your App details on the **Register new GitHub App** page and make sure to uncheck the **Expire user authorization tokens** and **Active** checkbox under **Identifying and authorizing users** and **Webhook** sections respectively.

    Set the Homepage URL to the URL of your ToolJet instance. For ToolJet Cloud, use `https://app.tooljet.com`. For self-hosted ToolJet, use the URL of your own ToolJet instance.
    
    :::note
    Add the following Repository permissions:
        - Contents: Read & Write
        - Pull requests: Read & Write
    :::

    After creating the GitHub App, you will be directed to the **GitHub App Settings** page. 

    :::note
    Make sure to copy the **App ID**. 
    :::
    Next, generate the **Private key** (`.pem `key), download it, and store it securely. This information will be essential later when configuring GitSync.
        <img className="screenshot-full img-l" src="/img/gitsync/github-config/github-app1.png" alt="GitHub App settings page showing the App ID and the prompt to generate a private key" />

### 3. Install the GitHub App
    
    To install your GitHub App, follow these steps:
    - Click on Install App on the **GitHub App Settings** page.<br />
        <img className="screenshot-full img-s" style={{ marginTop:'15px'}}  src="/img/gitsync/github-config/github-app2.png" alt="GitHub App settings sidebar with Install App highlighted" />
    - Click the **Install** button next to your organization.
    - Select repositories option and select the repositories you want to connect to ToolJet.
    - You’ll be redirected to the installation page. The number at the end of the URL is the **installation ID**. Save this for later. <br/>
        ```
        https://github.com/settings/installations/:installation_id
        ```

### 4. Configure GitHub in GitSync 

Navigate to the **Workspace settings** page and click on the **Configure git sync** tab. Then, enter the required configuration values after selecting GitHub as your repository provider.
    <img className="screenshot-full img-s" src="/img/gitsync/github-config/github-form-full.png" alt="GitHub configuration form in ToolJet with the Repository, Self hosted GitHub, and App access sections" />

The table below describes each configuration values:

#### Repository

| **Setting** | **Description** |
|-------------|----------------|
| **Repo URL**  | The URL of the repository you created to use with ToolJet. (e.g `https://github.com/your-org/repo-name.git`) |
| **Branch name** | Branch name of your repo. By default, it uses the main branch. |

#### Self-hosted GitHub (Optional)

| **Setting** | **Description** |
|-------------|-----------------|
| **GitHub enterprise URL** |    The domain used to access your self-hosted GitHub instance. If you use GitHub Cloud, you can leave this blank. |
| **GitHub enterprise API URL** |  The API endpoint for your self-hosted GitHub instance.  If you use GitHub Cloud, you can leave this blank. (e.g. `https://[hostname]/api/v3/`) |

#### App Access
| **Setting** | **Description**  |
|-------------|------------------|
| **GitHub app ID** | The [GitHub App ID](https://docs.github.com/en/developers/apps/identifying-and-authorizing-users-for-github-apps#authenticating-with-a-github-app). |
| **GitHub app installation ID** | The [GitHub installation ID](https://docs.github.com/en/developers/apps/managing-github-apps/installing-github-apps#installing-a-github-app). |
| **GitHub app private key** | Private key you downloaded after App creation. |

Once you've entered the necessary configurations, click **Save changes**. Your workspace is now connected to your GitHub repository.

:::note
You can use the same credentials to configure a specific repository across multiple instances or workspaces.
:::

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
