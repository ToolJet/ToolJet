---
id: marketplace-plugin-azurerepos
title: Azure Repos
---

ToolJet offers the capability to establish a connection with Azure Repos in order to read from and commit to Git repositories for source control and version management.

## Connection

To connect with Azure Repos, you will need the **Organization Name (e.g., https://dev.azure.com/your-organization)** and a **Personal Access Token (PAT)**.
Generate a Personal Access Token(PAT) by navigating to User Settings, then selecting Personal Access Tokens. Ensure the token includes the necessary scopes based on the operations you want to perform.

<img className="screenshot-full" src="/img/marketplace/plugins/azurerepos/personal-access-token.png" alt="get azure repository"/>

## Supported Operations

1. **[Get Azure Repository](#get-azure-repository)**
2. **[Get Repository Commits](#get-repository-commits)**
3. **[Get Repository Branches](#get-repository-branches)**
4. **[Get Repository Pushes](#get-repository-pushes)**
5. **[Get Project Pull Requests](#get-project-pull-requests)**

### Get Azure Repository

Retrieves details of a specific repository within your Azure DevOps project.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/marketplace/plugins/azurerepos/get-repo.png" alt="get azure repository"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: test
```

</details>

### Get Repository Commits

Fetches a list of commits made to a selected repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/marketplace/plugins/azurerepos/get-commits.png" alt="get repository commits"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: test
```

</details>

### Get Repository Branches

Lists all branches available in a specified Azure repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/marketplace/plugins/azurerepos/get-branches.png" alt="get repository branches"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: test
Repository commits: ToolJet
```

</details>

### Get Repository Pushes

Retrieves information about recent pushes made to the repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/marketplace/plugins//azurerepos/get-pushes.png" alt="get repository pushes"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: test
Repository commits: ToolJet
```

</details>

### Get Project Pull Requests

Fetches pull requests associated with the selected project and repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/marketplace/plugins/azurerepos/get-prs.png" alt="get project pull requests"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project pull requests: test
```

</details>


