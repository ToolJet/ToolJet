---
id: marketplace-plugin-github
title: GitHub
---

ToolJet offers seamless integration with GitHub. This connection allows you to directly interact with GitHub repositories and data.

## Connection

To connect to GitHub, you need the following credential:
- **Personal Access Token**: You can generate this token through your **[GitHub Account Settings](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)**.

You'll need a Personal Access Token to access data from private repositories. Public repository data remains accessible without a Personal Access Token.

<img className="screenshot-full" src="/img/marketplace/plugins/github/connection-v3.png" alt="Marketplace: GitHub" />

### Get User Info

This operation fetches details for a specified user.

#### Required Parameter

- **Username**: Specify the GitHub username or organization to retrieve their details.

<img className="screenshot-full" src="/img/marketplace/plugins/github/get-user-info-v4.png" alt="Marketplace: GitHub" />

<details>
<summary>**Example Value**</summary>
```yaml
    "Username":"ToolJet"
```
</details>

<details>
<summary>**Example Response**</summary>
```yaml
{
    login:"ToolJet"
    id:"ID"
    node_id:"NODE ID"
    avatar_url:"https://avatars.githubusercontent.com/u/82193554?v=4"
    gravatar_id:""
    url:"https://api.github.com/users/ToolJet"
    html_url:"https://github.com/ToolJet"
    followers_url:"https://api.github.com/users/ToolJet/followers"
    following_url:"https://api.github.com/users/ToolJet/following{/other_user}"
    gists_url:"https://api.github.com/users/ToolJet/gists{/gist_id}"
    starred_url:"https://api.github.com/users/ToolJet/starred{/owner}{/repo}"
    subscriptions_url:"https://api.github.com/users/ToolJet/subscriptions"
    organizations_url:"https://api.github.com/users/ToolJet/orgs"
    repos_url:"https://api.github.com/users/ToolJet/repos"
    events_url:"https://api.github.com/users/ToolJet/events{/privacy}"
    received_events_url:"https://api.github.com/users/ToolJet/received_events"
    "..."
}
```
</details>

### Get Repository

Fetches detailed information about a specific repository.

#### Required Parameters

- **Owner**: Name of the repository's owner, which can be either a GitHub user or an organization.
- **Repository**: The exact name of the repository.

<img className="screenshot-full" src="/img/marketplace/plugins/github/get-repo-v2.png" alt="Marketplace: GitHub" />

<details>
<summary>**Example Value**</summary>
```yaml
    "Owner":"ToolJet"
    "Repository":"tooljet"
```
</details>

<details>
<summary>**Example Response**</summary>
```yaml
{
    "id": ID
    "node_id":"NODE ID"
    "name":"ToolJet"
    "full_name":"ToolJet/ToolJet"
    "private":false
    "html_url":"https://github.com/ToolJet/ToolJet"
    "description":"Low-code platform for building business applications. Connect to databases, cloud storages, GraphQL, API endpoints, Airtable, Google sheets, OpenAI, etc and build apps using drag and drop application builder. Built using JavaScript/TypeScript. 🚀"
    "fork":false
    "url":"https://api.github.com/repos/ToolJet/ToolJet"
    "forks_url":"https://api.github.com/repos/ToolJet/ToolJet/forks"
    "keys_url":"https://api.github.com/repos/ToolJet/ToolJet/keys{/key_id}"
    "collaborators_url":"https://api.github.com/repos/ToolJet/ToolJet/collaborators{/collaborator}"
    "teams_url":"https://api.github.com/repos/ToolJet/ToolJet/teams"
    "..."
}
```
</details>

### Get Repository Issues

Generates a list of issues associated with a repository, with options to filter them by their status.

#### Required Parameters

- **Owner**: The name of the repository's owner. The owner can either be a GitHub organization or a user.
- **Repository**: The repository name for which the issues are to be retrieved.
- **State**: Filter the issues by their status: All, Open, or Closed.

<img className="screenshot-full" src="/img/marketplace/plugins/github/get-issue-v2.png" alt="Marketplace: GitHub" />

<details>
<summary>**Example Value**</summary>
```yaml
    "Owner":"ToolJet"
    "Repository":"tooljet"
    "State":"All"
```
</details>

<details>
<summary>**Example Response**</summary>
```yaml
{
    "url":"https://api.github.com/repos/ToolJet/ToolJet/issues/12086"
    "repository_url":"https://api.github.com/repos/ToolJet/ToolJet"
    "labels_url":"https://api.github.com/repos/ToolJet/ToolJet/issues/12086/labels{/name}"
    "comments_url":"https://api.github.com/repos/ToolJet/ToolJet/issues/12086/comments"
    "events_url":"https://api.github.com/repos/ToolJet/ToolJet/issues/12086/events"
    "html_url":"https://github.com/ToolJet/ToolJet/pull/12086"
    "id":ID
    "node_id":"NODE ID"
    "number":12086
    "title":"add app-git and git-sync modules"
}
```
</details>

### Get Repository Pull Requests

Generates a list of pull requests from a repository, with options to filter them by their status.

#### Required Parameters

- **Owner**: The name of the repository's owner. The owner can either be a GitHub organization or a user.
- **Repository**: The repository name for which the pull requests are to be retrieved.
- **State**: Filter the pull requests by their status: All, Open, or Closed.

<img className="screenshot-full" src="/img/marketplace/plugins/github/get-pull-v2.png" alt="Marketplace: GitHub" />

<details>
<summary>**Example Value**</summary>
```yaml
    "Owner":"ToolJet"
    "Repository":"tooljet"
    "State":"All"
```
</details>

<details>
<summary>**Example Response**</summary>
```yaml
{
    "url":"https://api.github.com/repos/ToolJet/ToolJet/pulls/12086"
    "id":ID
    "node_id":"NODE ID"
    "html_url":"https://github.com/ToolJet/ToolJet/pull/12086"
    "diff_url":"https://github.com/ToolJet/ToolJet/pull/12086.diff"
    "patch_url":"https://github.com/ToolJet/ToolJet/pull/12086.patch"
    "issue_url":"https://api.github.com/repos/ToolJet/ToolJet/issues/12086"
    "number":12086
    "state":"open"
    "locked":false
    "title":"add app-git and git-sync modules"
}
```
</details>