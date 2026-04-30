---
id: gitsync-env-vars
title: Configure GitSync via Environment Variables
---

<PlanBadge type="enterprise" />
<PlanBadge type="self-hosted" />

:::warning BETA
Configuring Git Sync using environment variables is currently in beta and is not recommended for production use.
:::

GitSync can be configured using environment variables instead of the ToolJet UI. This allows you to supply Git credentials directly on the host machine, scoped per workspace, and is particularly useful for self-hosted deployments where configuration needs to be reproducible and automated.

This approach supports two primary use cases:

* **Static configuration:** Credentials are defined once via environment variables, making it easy to spin up new ToolJet instances with preconfigured GitSync settings.
* **Dynamic credential management:** Sensitive credentials such as GitHub App private keys or access tokens are often rotated periodically due to security and compliance requirements. Managing these through environment variables enables seamless integration with external secret management systems (e.g., AWS Secrets Manager, Vault, CI/CD pipelines), allowing automated rotation without manual updates through the UI.

## Setup

### 1. Create the Environment File

On your host machine, create a file named `.tj_env.<workspace-slug-or-uuid>`. This file uses the standard dotenv format (`KEY=VALUE`) and holds the git credentials for a specific workspace.

You can name the file using the workspace **slug** or **UUID**:
 
| Naming style | Example |
| --- | --- |
| By workspace slug | `.tj_env.my-workspace` |
| By workspace UUID | `.tj_env.550e8400-e29b-41d4-a716-446655440000` |

You can place multiple `.tj_env.*` files in the same directory which will be one per workspace.

### 2. Add Your Git Provider Credentials

Populate the file with the required keys for your git provider. ToolJet supports the following providers:
 
#### GitHub (HTTPS)
 
| **Key** | **Description** |
| --- | --- |
| `GITHUB_URL` | The HTTPS URL of your GitHub repository. (e.g. `https://github.com/your-org/your-repo`) |
| `GITHUB_BRANCH` | The branch to sync with. |
| `GITHUB_APP_ID` | Your GitHub App ID. |
| `GITHUB_INSTALLATION_ID` | The installation ID for your GitHub App. |
| `GITHUB_PRIVATE_KEY` | The private key generated when creating the GitHub App. Escape newlines as `\n`. |
 
For self-hosted GitHub Enterprise, you can additionally include:
 
| **Key** | **Description** |
| --- | --- |
| `GITHUB_ENTERPRISE_URL` | The domain of your self-hosted GitHub instance. (e.g. `https://github.your-company.com`) |
| `GITHUB_ENTERPRISE_API_URL` | The API endpoint of your self-hosted GitHub instance. (e.g. `https://api.github.your-company.com`) |

#### GitLab
 
| **Key** | **Description** |
| --- | --- |
| `GITLAB_URL` | The URL of your GitLab repository. (e.g. `https://gitlab.com/your-org/your-repo`) |
| `GITLAB_BRANCH` | The branch to sync with. Defaults to `main`. |
| `GITLAB_PROJECT_ID` | Your GitLab project ID. |
| `GITLAB_PROJECT_ACCESS_TOKEN` | A project access token with read/write permissions. |
 
For self-hosted GitLab, you can additionally include:
 
| **Key** | **Description** |
| --- | --- |
| `GITLAB_ENTERPRISE_URL` | The domain of your self-hosted GitLab instance. (e.g. `https://gitlab.your-company.com`) |

#### Git (SSH)
| **Key**               | **Description**                                                                   |
| --------------------- | --------------------------------------------------------------------------------- |
| `GIT_SSH_URL`         | The SSH URL of your Git repository (e.g. `git@your-git-host.com:org/repo.git`).   |
| `GIT_SSH_BRANCH`      | The branch to sync with.                                                          |
| `GIT_SSH_PRIVATE_KEY` | The SSH private key used for authentication. Ensure newlines are escaped as `\n`. |
| `GIT_SSH_PUBLIC_KEY`  | The corresponding SSH public key.                                                 |
| `GIT_SSH_KEY_TYPE`    | The SSH key type (e.g. `ed25519`, `rsa`).                                         |

 
:::note
Only one provider can be active per workspace at a time. If any required key for a provider is missing, ToolJet will skip that provider. Double check your key list if the configuration does not activate.
:::

### 3. Make the File Available to the Server
 
The `.tj_env.*` file must be accessible at `/app/` inside the container at the time the server starts. How you get it there depends on your deployment setup. For Docker Compose, refer to the [Docker Compose setup guide](#docker-compose-setup).

### 4. Restart the Server

Once the file is mounted, restart the ToolJet server.
On startup, ToolJet reads all `.tj_env.*` files from `/app/` and maps them to their respective workspaces.  
 
If the file is removed, ToolJet will automatically deactivate the configuration on the next restart.
 
:::note
Environment files are only read at startup. Any changes made to a `.tj_env.*` file while the server is running will not take effect until the server is restarted.
:::
 
## Docker Compose Setup

Mount the `.tj_env.*` file from your host machine into the container at `/app/`. You can mount individual files or an entire directory.
 
**To mount a single workspace file:**

```yaml
services:
  tooljet:
    image: tooljet/tooljet:latest
    volumes:
      - ./.tj_env.my-workspace:/app/.tj_env.my-workspace
```
 
**To mount multiple workspace files at once:**
 
```yaml
services:
  tooljet:
    image: tooljet/tooljet:latest
    volumes:
      - ./workspace-envs:/app
```

<details id="tj-dropdown">
<summary>Sample Docker Compose configuration</summary>
 
```yaml
name: tooljet-production
 
services:
  tooljet:
    image: tooljet/tj:v1
    container_name: tooljet-app
    platform: linux/amd64
    restart: always
    env_file: .env.production
    ports:
      - "80:80"
    depends_on:
      - postgres
    environment:
      SERVE_CLIENT: "true"
      PORT: "80"
    command: npm run start:prod
    volumes:
      - ./.tj_env.devs-workspace:/app/.tj_env.devs-workspace
 
  postgres:
    container_name: postgres
    image: postgres:16
    restart: always
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
 
volumes:
  postgres_data:
    driver: local
```
</details>

:::note
Only one git provider (GitHub HTTPS, Git SSH, or GitLab) can be active per workspace at a time.
:::