---
id: azurerepos
title: Azure Repos
---

ToolJet offers the capability to establish a connection with Azure Repos in order to read from and commit to Git repositories for source control and version management.

## Connection

To establish a connection with the Azure Repos data source, you can either click on the + Add new Data source button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview)** page from the ToolJet dashboard.

ToolJet requires the following to connect to your Azure Repos:

- **Organization Name (e.g., https://dev.azure.com/your-organization)**
- **Personal Access Token (PAT)**

You can generate a Personal Access Token (PAT) from your Azure DevOps profile by navigating to User Settings, then selecting Personal access tokens. Ensure the token has appropriate scopes depending on the operations you intend to perform.

## Querying Azure Repos

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Azure Repos** datasource added in previous step.
3. Select the desired **operation** from the dropdown and enter the required **parameters**.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

:::tip
Query results can be transformed using Transformation. For more information on transformations, please refer to our documentation at **[link](/docs/tutorial/transformations)**.
:::

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

<img className="screenshot-full" src="/img/datasource-reference/azurerepos/get-repo.png" alt="get azure repository"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: testProj
```

</details>

### Get Repository Commits

Fetches a list of commits made to a selected repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/datasource-reference/azurerepos/get-commits.png" alt="get repository commits"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: testProj
```

</details>

### Get Repository Branches

Lists all branches available in a specified Azure repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/datasource-reference/azurerepos/get-branches.png" alt="get repository branches"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: testProj
Repository commits: ToolJet
```

</details>

### Get Repository Pushes

Retrieves information about recent pushes made to the repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/datasource-reference/azurerepos/get-pushes.png" alt="get repository pushes"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project: testProj
Repository commits: ToolJet
```

</details>

### Get Project Pull Requests

Fetches pull requests associated with the selected project and repository.

#### Required Parameter

- **Project**

<img className="screenshot-full" src="/img/datasource-reference/azurerepos/get-prs.png" alt="get project pull requests"/>

<details id="tj-dropdown">
<summary>**Example Values**</summary>

```json
Project pull requests: testProj
```

</details>


