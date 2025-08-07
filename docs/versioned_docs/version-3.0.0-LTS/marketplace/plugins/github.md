---
id: marketplace-plugin-github
title: GitHub
---

ToolJet offers seamless integration with GitHub. This connection allows you to directly interact with GitHub repositories and data.

## Connection

To connect to GitHub, you need the following credential:
- **Personal Access Token**: You can generate this token through your **[GitHub Account Settings](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)**.

You'll need a Personal Access Token to access data from private repositories. Public repository data remains accessible without a Personal Access Token.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/github/connection-v2.png" alt="Marketplace: GitHub" />
</div>

## Supported Queries

- **[Get user info](#get-user-info)**
- **[Get repository](#get-repository)**
- **[Get repository issues](#get-repository-issues)**
- **[Get repository pull requests](#get-repository-pull-requests)**

### Get User Info

This operation fetches details for a specified user.

#### Required Parameters: 

- **Username**: Specify the GitHub username or organization to retrieve their details.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/marketplace/plugins/github/getuserinfo-v2.png" alt="Marketplace: GitHub" />
</div>

### Get Repository

Fetches detailed information about a specific repository.

#### Required Parameters: 

- **Owner**: Name of the repository's owner, which can be either a GitHub user or an organization.
- **Repository**: The exact name of the repository.

### Get Repository Issues

Generates a list of issues associated with a repository, with options to filter them by their status.

#### Required Parameters:

- **Owner**: The name of the repository's owner. The owner can either be a GitHub organization or a user.
- **Repository**: The repository name for which the issues are to be retrieved.
- **State**: Filter the issues by their status: All, Open, or Closed.

### Get Repository Pull Requests

Generates a list of pull requests from a repository, with options to filter them by their status.

#### Required Parameters:

- **Owner**: The name of the repository's owner. The owner can either be a GitHub organization or a user.
- **Repository**: The repository name for which the pull requests are to be retrieved.
- **State**: Filter the pull requests by their status: All, Open, or Closed.